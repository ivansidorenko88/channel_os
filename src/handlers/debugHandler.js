const {
  getAnalyticsSchedulerStatus,
  runAnalyticsSchedulerNow
} = require("../scheduler/analyticsCoreScheduler");

function formatResult(result) {
  if (!result) return "нет запусков";

  if (result.skipped) {
    return `пропущено: ${result.reason}`;
  }

  const errors = result.errors && result.errors.length
    ? "\nОшибки:\n" + result.errors.map((error) => `• ${error.title || "канал"}: ${error.message}`).join("\n")
    : "";

  return [
    `Каналов: ${result.total}`,
    `Успешно: ${result.success}`,
    `Ошибок: ${result.failed}`,
    errors
  ].filter(Boolean).join("\n");
}

function buildDebugText() {
  const status = getAnalyticsSchedulerStatus();

  return [
    "🛠 Debug: Analytics Engine",
    "",
    `Scheduler: ${status.started ? "✅ запущен" : "❌ не запущен"}`,
    `Сейчас выполняется: ${status.isRunning ? "да" : "нет"}`,
    `Интервал: ${status.intervalMinutes || 30} мин.`,
    `Стартовал: ${status.formatted.startedAt}`,
    `Последний запуск: ${status.formatted.lastRunAt}`,
    `Последнее завершение: ${status.formatted.lastFinishedAt}`,
    `Следующий запуск: ${status.formatted.nextRunAt}`,
    `Кол-во запусков: ${status.runCount}`,
    "",
    "Последний результат:",
    formatResult(status.lastResult),
    "",
    status.lastError ? `Последняя ошибка: ${status.lastError}` : "Последняя ошибка: нет"
  ].join("\n");
}

function debugKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔄 Собрать снимки сейчас", callback_data: "debug:analytics:run" }],
        [{ text: "📊 Статус Analytics", callback_data: "debug:analytics:status" }],
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

function registerDebugHandler(bot) {
  bot.command("debug", async (ctx) => {
    return ctx.reply(buildDebugText(), debugKeyboard());
  });

  bot.command("debug_analytics", async (ctx) => {
    return ctx.reply(buildDebugText(), debugKeyboard());
  });

  bot.action("debug:analytics:status", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply(buildDebugText(), debugKeyboard());
  });

  bot.action("debug:analytics:run", async (ctx) => {
    await ctx.answerCbQuery("Запускаю сбор снимков...");
    await ctx.reply("🔄 Запускаю ручной сбор снимков Analytics...");

    const result = await runAnalyticsSchedulerNow(ctx);

    return ctx.reply(
      [
        "✅ Ручной сбор завершён",
        "",
        formatResult(result),
        "",
        "Проверь `📊 Аналитика` → `📈 Общий обзор`."
      ].join("\n"),
      debugKeyboard()
    );
  });
}

module.exports = { registerDebugHandler };
