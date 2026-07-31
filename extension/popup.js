const textInput = document.getElementById("text-input");
const imageInput = document.getElementById("image-input");
const checkTextBtn = document.getElementById("check-text-btn");
const usageEl = document.getElementById("usage");
const resultEl = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const resultReason = document.getElementById("result-reason");
const resultAction = document.getElementById("result-action");
const upgradeEl = document.getElementById("upgrade");
const upgradeBtn = document.getElementById("upgrade-btn");

const VERDICT_LABELS = {
  scam: "🚨 Likely a scam",
  legitimate: "✅ Looks legitimate",
  uncertain: "🤔 Uncertain — be careful",
};

renderUsage();

checkTextBtn.addEventListener("click", async () => {
  const text = textInput.value.trim();
  if (!text) return;
  await runCheck(() => checkText(text));
});

imageInput.addEventListener("change", async () => {
  const file = imageInput.files[0];
  if (!file) return;
  const base64 = await fileToBase64(file);
  await runCheck(() => checkImage(base64, file.type || "image/jpeg"));
  imageInput.value = "";
});

upgradeBtn.addEventListener("click", () => {
  chrome.tabs.create({
    url: "mailto:emraanadil.dsp@gmail.com?subject=Senior%20Scam%20Checker%20Pro",
  });
});

async function runCheck(fetchFn) {
  const allowed = await canCheck();
  if (!allowed) {
    upgradeEl.hidden = false;
    resultEl.hidden = true;
    return;
  }

  upgradeEl.hidden = true;
  setLoading(true);

  try {
    const verdict = await fetchFn();
    await recordCheck();
    showResult(verdict);
  } catch (err) {
    showError(err.message || "Something went wrong. Please try again.");
  } finally {
    setLoading(false);
    renderUsage();
  }
}

function showResult(verdict) {
  resultTitle.textContent = VERDICT_LABELS[verdict.verdict] || "Result";
  resultReason.textContent = verdict.reason;
  resultAction.textContent = verdict.action;
  resultEl.hidden = false;
}

function showError(message) {
  resultTitle.textContent = "⚠️ Couldn't complete the check";
  resultReason.textContent = message;
  resultAction.textContent = "";
  resultEl.hidden = false;
}

function setLoading(isLoading) {
  checkTextBtn.disabled = isLoading;
  checkTextBtn.textContent = isLoading ? "Checking…" : "Check text";
}

async function renderUsage() {
  const usage = await getUsage();
  usageEl.textContent = usage.isPro
    ? "Unlimited checks (Pro)"
    : `${usage.remaining} of ${usage.limit} free checks left this month`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
