importScripts("lib/api.js", "lib/usage.js", "lib/license.js");

const MENU_ID = "check-scam-selection";

// Printed on every service-worker start so you can tell at a glance, from the
// service worker console, which build Chrome is actually running — unpacked
// extensions do NOT pick up file changes until you hit reload.
console.log(`Senior Scam Checker: background v${chrome.runtime.getManifest().version} ready`);

chrome.runtime.onInstalled.addListener((details) => {
  // removeAll first so a reload/update can't fail with "duplicate id", which
  // would leave the extension with no working context menu at all.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Check for scam: "%s"',
      contexts: ["selection"],
    });
  });

  if (details.reason === "install") {
    chrome.tabs.create({ url: chrome.runtime.getURL("welcome.html") });
  }

  revalidateLicenseIfDue();
});

chrome.runtime.onStartup.addListener(revalidateLicenseIfDue);

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText || !tab?.id) return;

  // Chrome blocks script injection into its own internal pages (chrome://,
  // the Web Store, the new tab page, etc). The context menu item still shows
  // up there since Chrome doesn't filter by URL, so bail out quietly instead
  // of throwing — there's nowhere to render the card on those pages anyway.
  if (!/^https?:\/\//.test(tab.url || "")) {
    console.warn("Senior Scam Checker: can't run on this page:", tab.url);
    return;
  }

  try {
    await injectOverlay(tab.id);

    const allowed = await canCheck();
    if (!allowed) {
      await callInPage(tab.id, "__sscShowUpgrade");
      return;
    }

    await callInPage(tab.id, "__sscShowLoading");

    try {
      const verdict = await checkText(info.selectionText);
      await recordCheck();
      await callInPage(tab.id, "__sscShowResult", verdict);
    } catch (err) {
      await callInPage(tab.id, "__sscShowError", err.message || "Please try again.");
    }
  } catch (err) {
    console.warn("Senior Scam Checker: couldn't show the card on this page:", err);
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "open-popup") {
    // openPopup() only exists in Chrome 127+, and even there it throws if
    // there's no active window. The options page carries the same upgrade
    // flow, so fall back to that rather than doing nothing.
    try {
      const opening = chrome.action.openPopup?.();
      if (opening?.catch) opening.catch(() => chrome.runtime.openOptionsPage());
      else if (!chrome.action.openPopup) chrome.runtime.openOptionsPage();
    } catch {
      chrome.runtime.openOptionsPage();
    }
  }
});

async function injectOverlay(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["lib/theme.js", "content.js"],
  });
}

async function callInPage(tabId, fnName, arg) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (name, value) => window[name](value),
    args: [fnName, arg],
  });
}
