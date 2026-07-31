const textInput = document.getElementById("text-input");
const imageInput = document.getElementById("image-input");
const checkTextBtn = document.getElementById("check-text-btn");
const usageBarFill = document.getElementById("usage-bar-fill");
const usageLabel = document.getElementById("usage-label");
const usageBar = document.getElementById("usage-bar");
const resultEl = document.getElementById("result");
const resultIcon = document.getElementById("result-icon");
const resultTitle = document.getElementById("result-title");
const resultReason = document.getElementById("result-reason");
const resultAction = document.getElementById("result-action");
const resetBtn = document.getElementById("reset-btn");
const upgradeEl = document.getElementById("upgrade");
const upgradeBtn = document.getElementById("upgrade-btn");
const optionsBtn = document.getElementById("options-btn");
const privacyLink = document.getElementById("privacy-link");

const VERDICT_LABELS = {
  scam: { icon: "⚠️", title: "Likely a Scam" },
  legitimate: { icon: "✅", title: "Looks Legitimate" },
  uncertain: { icon: "❓", title: "Not Sure — Be Careful" },
};

privacyLink.href = "https://scam-checker-privacy.emraanadil.workers.dev/";
optionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
upgradeBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
resetBtn.addEventListener("click", resetForm);

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
  const labels = VERDICT_LABELS[verdict.verdict] || { icon: "❓", title: "Result" };
  resultEl.dataset.verdict = verdict.verdict;
  resultIcon.textContent = labels.icon;
  resultTitle.textContent = labels.title;
  resultReason.textContent = verdict.reason;
  resultAction.textContent = verdict.action ? `What to do: ${verdict.action}` : "";
  resultEl.hidden = false;
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(message) {
  resultEl.dataset.verdict = "error";
  resultIcon.textContent = "⚠️";
  resultTitle.textContent = "Couldn't complete the check";
  resultReason.textContent = message;
  resultAction.textContent = "";
  resultEl.hidden = false;
}

function resetForm() {
  textInput.value = "";
  resultEl.hidden = true;
  textInput.focus();
}

function setLoading(isLoading) {
  checkTextBtn.disabled = isLoading;
  checkTextBtn.innerHTML = isLoading
    ? '<span class="spinner"></span>Checking…'
    : "Check text";
}

async function renderUsage() {
  const usage = await getUsage();
  if (usage.isPro) {
    usageBar.hidden = true;
    return;
  }
  usageBar.hidden = false;
  const pct = usage.limit ? Math.round((usage.count / usage.limit) * 100) : 0;
  usageBarFill.style.width = `${Math.min(100, pct)}%`;
  usageBarFill.classList.toggle("low", usage.remaining <= 1);
  usageLabel.textContent = `${usage.remaining}/${usage.limit} free`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
