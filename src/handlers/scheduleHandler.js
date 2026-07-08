const { mainMenu } = require("../keyboards/mainMenu");
const { getState, clearState } = require("../middleware/state");
const { parseDateTimeRu, scheduleDraft, listUserScheduled } = require("../services/scheduleService");

function formatDate(date) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function registerScheduleHandler(bot) {
  bot.on("text", async (ctx, next) => {
    const currentState = getState(ctx.from.id);

    if (!currentState || currentState.state !== "WAITING_SCHEDULE_TIME") return next();

    const date = parseDateTimeRu(ctx.message.text);

    if (!date) {
      return ctx.reply("❌ Неверный формат или дата уже прошла. Пример: 25.07.2026 21:30");
    }

    const result = await scheduleDraft(ctx.from, currentState.payload.draftId, date);
    clearState(ctx.from.id);

    if (!result.ok) return ctx.reply(result.message, mainMenu());

    return ctx.reply(
      `✅ Пост запланирован.\n\n📢 Канал: ${result.channel.title}\n🕒 Время: ${formatDate(result.scheduled.scheduledAt)}`,
      mainMenu()
    );
  });

  bot.action("schedule:list", async (ctx) => {
    await ctx.answerCbQuery();

    const items = await listUserScheduled(ctx.from);

    if (!items.length) return ctx.reply("📅 Запланированных постов пока нет.", mainMenu());

    const text = items.map((item, index) => {
      return `${index + 1}. ${item.channel.title}\nТип: ${item.type}\nВремя: ${formatDate(item.scheduledAt)}`;
    }).join("\n\n");

    return ctx.reply(`📅 Запланированные посты:\n\n${text}`, mainMenu());
  });
}

module.exports = { registerScheduleHandler };
