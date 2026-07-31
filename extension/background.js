importScripts("lib/api.js", "lib/usage.js");

const MENU_ID = "check-scam-selection";
const ICON_URL = chrome.runtime.getURL("icons/icon128.png");

const VERDICT_LABELS = {
  scam: "🚨 Likely a scam",
  legitimate: "✅ Looks legitimate",
  uncertain: "🤔 Uncertain — be careful",
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'Check for scam: "%s"',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const allowed = await canCheck();
  if (!allowed) {
    notify(
      "Free checks used up this month",
      "Open the Senior Scam Checker icon in your toolbar to upgrade for unlimited checks."
    );
    return;
  }

  notify("Checking…", "Senior Scam Checker is analyzing the selected text.");

  try {
    const verdict = await checkText(info.selectionText);
    await recordCheck();
    notify(
      VERDICT_LABELS[verdict.verdict] || "Result",
      `${verdict.reason} ${verdict.action}`.slice(0, 250)
    );
  } catch (err) {
    notify("Couldn't complete the check", err.message || "Please try again.");
  }
});

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: ICON_URL,
    title,
    message,
    priority: 1,
  });
}
