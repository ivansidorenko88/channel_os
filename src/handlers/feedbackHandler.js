const {
  ADMIN_IDS
} = require("../config/env");
const {
  setState,
  getState,
  clearState
} = require("../middleware/state");
const {
  saveFeedback
} = require("../services/feedbackService");
const {
  feedbackKeyboard
} = require("../keyboards/feedbackKeyboard");

async function notifyAdmins(bot, feedback) {
  const user = feedback.user;
  const name = user.username
    ? `@${user.username}`
    : [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ") ||
      `ID ${user.telegramId}`;

  const type =
    feedback.type === "bug"
      ? "🐞 Ошибка"
      : "💡 Предложение";

  for (const adminId of ADMIN_IDS) {
    try {
      await bot.telegram.sendMessage(
        adminId,
        [
          `${type} от пользователя`,
          "",
          `Пользователь: ${name}`,
          `Telegram ID: ${user.telegramId}`,
          "",
          feedback.message
        ].join("\n")
      );
    } catch (error) {
      console.error(
        `Feedback notification to admin ${adminId} failed:`,
        error.message
      );
    }
  }
}

function registerFeedbackHandler(bot) {
  bot.command("feedback", async (ctx) => {
    return ctx.reply(
      [
        "💬 Обратная связь",
        "",
        "Что ты хочешь отправить?"
      ].join("\n"),
      feedbackKeyboard()
    );
  });

  bot.action("feedback:main", async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.reply(
      [
        "💬 Обратная связь",
        "",
        "Что ты хочешь отправить?"
      ].join("\n"),
      feedbackKeyboard()
    );
  });

  bot.action(
    /^feedback:type:(idea|bug)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const type = ctx.match[1];

      setState(
        ctx.from.id,
        "WAITING_FEEDBACK",
        { type }
      );

      return ctx.reply(
        [
          type === "bug"
            ? "🐞 Опиши ошибку"
            : "💡 Опиши идею",
          "",
          "Чем подробнее сообщение, тем проще нам разобраться.",
          "",
          "Для отмены нажми /cancel"
        ].join("\n")
      );
    }
  );

  bot.on("text", async (ctx, next) => {
    const currentState = getState(ctx.from.id);

    if (
      !currentState ||
      currentState.state !== "WAITING_FEEDBACK"
    ) {
      return next();
    }

    const feedback = await saveFeedback(
      ctx.from,
      currentState.payload.type,
      ctx.message.text
    );

    clearState(ctx.from.id);

    if (!feedback) {
      return ctx.reply(
        "❌ Сообщение пустое. Попробуй ещё раз через /feedback."
      );
    }

    await notifyAdmins(bot, feedback);

    return ctx.reply(
      [
        "✅ Сообщение отправлено",
        "",
        "Спасибо за обратную связь. Она сохранена и доступна администратору проекта."
      ].join("\n")
    );
  });
}

module.exports = {
  registerFeedbackHandler
};
