const { mainMenu } = require("../keyboards/mainMenu");
const { contentPlanKeyboard } = require("../keyboards/contentPlanKeyboards");
const { getState, clearState } = require("../middleware/state");
const {
  parseDateTimeRu,
  scheduleDraft,
  listUserScheduled
} = require("../services/scheduleService");
const {
  buildPlanListText
} = require("../utils/contentPlanFormatter");
const {
  contentPlanListKeyboard
} = require("../keyboards/contentPlanKeyboards");

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

    if (
      !currentState ||
      currentState.state !== "WAITING_SCHEDULE_TIME"
    ) {
      return next();
    }

    const date = parseDateTimeRu(ctx.message.text);

    if (!date) {
      return ctx.reply(
        "❌ Неверный формат или дата уже прошла. Пример: 25.07.2026 21:30"
      );
    }

    const result = await scheduleDraft(
      ctx.from,
      currentState.payload.draftId,
      date
    );

    clearState(ctx.from.id);

    if (!result.ok) {
      return ctx.reply(result.message, mainMenu());
    }

    return ctx.reply(
      [
        "✅ Пост добавлен в контент-план.",
        "",
        `📢 Канал: ${result.channel.title}`,
        `🕒 Время: ${formatDate(result.scheduled.scheduledAt)}`,
        "🔔 Напоминание: за 30 минут",
        "",
        "Повтор, рубрику и время можно изменить в Content Plan."
      ].join("\n"),
      contentPlanKeyboard()
    );
  });

  bot.action("schedule:list", async (ctx) => {
    await ctx.answerCbQuery();

    const items = await listUserScheduled(ctx.from);

    return ctx.reply(
      buildPlanListText(
        items,
        "📚 Вся очередь публикаций"
      ),
      contentPlanListKeyboard(items, "all")
    );
  });
}

module.exports = {
  registerScheduleHandler
};
