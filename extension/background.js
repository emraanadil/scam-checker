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
