const appearanceGroup = document.getElementById("appearance-group");
const textSizeGroup = document.getElementById("text-size-group");
const proActive = document.getElementById("pro-active");
const proInactive = document.getElementById("pro-inactive");
const buyBtn = document.getElementById("buy-btn");
const licenseInput = document.getElementById("license-input");
const activateBtn = document.getElementById("activate-btn");
const licenseStatus = document.getElementById("license-status");
const deactivateBtn = document.getElementById("deactivate-btn");

init();

async function init() {
  const { appearance, textSize } = await chrome.storage.local.get(["appearance", "textSize"]);
  setActiveSegment(appearanceGroup, appearance || "system");
  setActiveSegment(textSizeGroup, textSize || "normal");
  await renderProState();
}

appearanceGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  setActiveSegment(appearanceGroup, btn.dataset.value);
  chrome.storage.local.set({ appearance: btn.dataset.value });
});

textSizeGroup.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  setActiveSegment(textSizeGroup, btn.dataset.value);
  chrome.storage.local.set({ textSize: btn.dataset.value });
});

function setActiveSegment(group, value) {
  group.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}

buyBtn.addEventListener("click", () => {
  const subject = encodeURIComponent("Senior Scam Checker Pro purchase");
  const body = encodeURIComponent(
    "Hi, I'd like to buy Senior Scam Checker Pro ($19.99 one-time). Please send payment instructions and a license key."
  );
  chrome.tabs.create({ url: `mailto:emraanadil.dsp@gmail.com?subject=${subject}&body=${body}` });
});

activateBtn.addEventListener("click", async () => {
  const key = licenseInput.value;
  activateBtn.disabled = true;
  activateBtn.textContent = "Checking…";
  licenseStatus.textContent = "";
  licenseStatus.className = "license-status";

  const result = await activateLicense(key);

  activateBtn.disabled = false;
  activateBtn.textContent = "Activate";

  if (result.valid) {
    licenseStatus.textContent = "License activated. Enjoy unlimited checks!";
    licenseStatus.classList.add("success");
    await renderProState();
  } else {
    licenseStatus.textContent = result.error || "That license key isn't valid.";
    licenseStatus.classList.add("error");
  }
});

deactivateBtn.addEventListener("click", async () => {
  await deactivateLicense();
  await renderProState();
});

async function renderProState() {
  const { isPro } = await chrome.storage.local.get(["isPro"]);
  proActive.hidden = !isPro;
  proInactive.hidden = Boolean(isPro);
}
