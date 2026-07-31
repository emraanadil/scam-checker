const FREE_CHECKS_PER_MONTH = 5;

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
}

async function getUsage() {
  const { usageMonth, usageCount, isPro } = await chrome.storage.local.get([
    "usageMonth",
    "usageCount",
    "isPro",
  ]);

  const month = currentMonthKey();
  const count = usageMonth === month ? usageCount ?? 0 : 0;

  return {
    isPro: Boolean(isPro),
    count,
    remaining: Math.max(0, FREE_CHECKS_PER_MONTH - count),
    limit: FREE_CHECKS_PER_MONTH,
  };
}

async function canCheck() {
  const usage = await getUsage();
  return usage.isPro || usage.remaining > 0;
}

async function recordCheck() {
  const usage = await getUsage();
  if (usage.isPro) return;

  await chrome.storage.local.set({
    usageMonth: currentMonthKey(),
    usageCount: usage.count + 1,
  });
}
