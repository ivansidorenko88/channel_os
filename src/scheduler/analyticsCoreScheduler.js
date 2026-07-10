const { collectAllSnapshots } = require("../services/analyticsCoreService");

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const schedulerState = {
  started: false,
  isRunning: false,
  intervalMinutes: null,
  initialDelaySeconds: null,
  startedAt: null,
  lastRunAt: null,
  lastFinishedAt: null,
  nextRunAt: null,
  lastResult: null,
  lastError: null,
  runCount: 0
};

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function formatDate(date) {
  if (!date) return "нет данных";

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

async function runAnalyticsCollection(bot, source = "scheduler") {
  if (schedulerState.isRunning) {
    console.log("[AnalyticsCore] Skip: collection already running");
    return {
      skipped: true,
      reason: "collection already running"
    };
  }

  schedulerState.isRunning = true;
  schedulerState.lastRunAt = new Date();
  schedulerState.lastError = null;

  try {
    console.log(`[AnalyticsCore] Collecting snapshots... Source: ${source}`);

    const result = await collectAllSnapshots(bot.telegram);

    schedulerState.runCount += 1;
    schedulerState.lastResult = result;
    schedulerState.lastFinishedAt = new Date();
    schedulerState.nextRunAt = addMinutes(schedulerState.lastRunAt, schedulerState.intervalMinutes || 30);

    console.log(
      `[AnalyticsCore] Done. Total: ${result.total}, success: ${result.success}, failed: ${result.failed}`
    );

    return result;
  } catch (error) {
    schedulerState.lastError = error.message;
    schedulerState.lastFinishedAt = new Date();
    schedulerState.nextRunAt = addMinutes(schedulerState.lastRunAt, schedulerState.intervalMinutes || 30);

    console.error("[AnalyticsCore] Scheduler error:", error);

    return {
      total: 0,
      success: 0,
      failed: 1,
      errors: [{ message: error.message }]
    };
  } finally {
    schedulerState.isRunning = false;
  }
}

function startAnalyticsCoreScheduler(bot) {
  const intervalMinutes = toNumber(process.env.ANALYTICS_INTERVAL_MINUTES, 30);
  const initialDelaySeconds = toNumber(process.env.ANALYTICS_INITIAL_DELAY_SECONDS, 15);

  if (schedulerState.started) {
    console.log("[AnalyticsCore] Scheduler already started");
    return;
  }

  schedulerState.started = true;
  schedulerState.intervalMinutes = intervalMinutes;
  schedulerState.initialDelaySeconds = initialDelaySeconds;
  schedulerState.startedAt = new Date();
  schedulerState.nextRunAt = new Date(Date.now() + initialDelaySeconds * 1000);

  setTimeout(() => runAnalyticsCollection(bot, "initial"), initialDelaySeconds * 1000);

  setInterval(() => {
    schedulerState.nextRunAt = new Date(Date.now() + intervalMinutes * 60 * 1000);
    runAnalyticsCollection(bot, "scheduler");
  }, intervalMinutes * 60 * 1000);

  console.log(`[AnalyticsCore] Scheduler started. Interval: ${intervalMinutes} minutes`);
}

function getAnalyticsSchedulerStatus() {
  return {
    ...schedulerState,
    formatted: {
      startedAt: formatDate(schedulerState.startedAt),
      lastRunAt: formatDate(schedulerState.lastRunAt),
      lastFinishedAt: formatDate(schedulerState.lastFinishedAt),
      nextRunAt: formatDate(schedulerState.nextRunAt)
    }
  };
}

async function runAnalyticsSchedulerNow(bot) {
  return runAnalyticsCollection(bot, "debug_manual");
}

module.exports = {
  startAnalyticsCoreScheduler,
  getAnalyticsSchedulerStatus,
  runAnalyticsSchedulerNow
};
