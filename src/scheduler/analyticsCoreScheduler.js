const { collectAllSnapshots } = require("../services/analyticsCoreService");

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function startAnalyticsCoreScheduler(bot) {
  const intervalMinutes = toNumber(process.env.ANALYTICS_INTERVAL_MINUTES, 30);
  const initialDelaySeconds = toNumber(process.env.ANALYTICS_INITIAL_DELAY_SECONDS, 15);

  async function run() {
    try {
      console.log("[AnalyticsCore] Collecting snapshots...");
      const result = await collectAllSnapshots(bot.telegram);
      console.log(`[AnalyticsCore] Done. Total: ${result.total}, success: ${result.success}, failed: ${result.failed}`);
    } catch (error) {
      console.error("[AnalyticsCore] Scheduler error:", error);
    }
  }

  setTimeout(run, initialDelaySeconds * 1000);
  setInterval(run, intervalMinutes * 60 * 1000);

  console.log(`[AnalyticsCore] Scheduler started. Interval: ${intervalMinutes} minutes`);
}

module.exports = { startAnalyticsCoreScheduler };
