importScripts("lib/api.js", "lib/usage.js", "lib/license.js");

const MENU_ID = "check-scam-selection";

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Check for scam: "%s"',
    contexts: ["selection"],
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

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type === "open-popup") {
    chrome.action.openPopup();
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
