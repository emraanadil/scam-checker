const TEXT_SIZE_SCALE = { normal: 1, large: 1.15, extraLarge: 1.3 };

async function applyAppearance() {
  const { appearance, textSize } = await chrome.storage.local.get(["appearance", "textSize"]);
  if (appearance === "light" || appearance === "dark") {
    document.documentElement.setAttribute("data-appearance", appearance);
  } else {
    document.documentElement.removeAttribute("data-appearance");
  }
  document.documentElement.style.setProperty("--scale", TEXT_SIZE_SCALE[textSize] || 1);
}

applyAppearance();
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.appearance || changes.textSize)) {
    applyAppearance();
  }
});
