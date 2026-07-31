const LICENSE_RECHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // re-validate once a day

async function activateLicense(key) {
  const trimmed = key.trim();
  if (!trimmed) return { valid: false, error: "Enter a license key." };

  const result = await verifyLicenseWithServer(trimmed);
  if (result.valid) {
    await chrome.storage.local.set({
      licenseKey: trimmed,
      isPro: true,
      licenseCheckedAt: Date.now(),
    });
  }
  return result;
}

async function deactivateLicense() {
  await chrome.storage.local.set({ licenseKey: null, isPro: false, licenseCheckedAt: null });
}

async function revalidateLicenseIfDue() {
  const { licenseKey, licenseCheckedAt } = await chrome.storage.local.get([
    "licenseKey",
    "licenseCheckedAt",
  ]);
  if (!licenseKey) return;

  const dueForRecheck =
    !licenseCheckedAt || Date.now() - licenseCheckedAt > LICENSE_RECHECK_INTERVAL_MS;
  if (!dueForRecheck) return;

  const result = await verifyLicenseWithServer(licenseKey);
  await chrome.storage.local.set({
    isPro: result.valid,
    licenseCheckedAt: Date.now(),
  });
}

async function verifyLicenseWithServer(key) {
  try {
    const response = await fetch(`${API_BASE_URL}/license/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { valid: false, error: data.error || "Couldn't verify that key." };
    }
    return { valid: Boolean(data.valid), error: data.valid ? null : "That license key isn't valid." };
  } catch {
    return { valid: false, error: "Couldn't reach the server. Check your connection." };
  }
}
