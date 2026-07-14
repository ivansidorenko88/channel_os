const {
  setState
} = require("../middleware/state");
const {
  getOnboardingData,
  completeOnboarding
} = require("../services/onboardingService");
const {
  onboardingKeyboard
} = require("../keyboards/onboardingKeyboard");
const {
  buildOnboardingText
} = require("../utils/onboardingFormatter");
const {
  renderDashboard
} = require("./dashboardHandler");

async function renderOnboarding(ctx, edit = false) {
  const data = await getOnboardingData(ctx.from);
  const text = buildOnboardingText(data);
  const keyboard = onboardingKeyboard(data.progress);

  if (edit && ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(text, keyboard);
    } catch (error) {
      const description =
        error?.response?.description ||
        error?.message ||
        "";

      if (!description.includes("message is not modified")) {
        throw error;
      }
    }
  }

  return ctx.reply(text, keyboard);
}

function registerOnboardingHandler(bot) {
  bot.command("guide", async (ctx) => {
    return renderOnboarding(ctx);
  });

  bot.action("onboarding:show", async (ctx) => {
    await ctx.answerCbQuery();
    return renderOnboarding(ctx, true);
  });

  bot.action("onboarding:connect", async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_CHANNEL_FORWARD"
    );

    return ctx.reply(
      [
        "📢 Подключение канала",
        "",
        "1. Добавь бота администратором.",
        "2. Разреши публиковать сообщения.",
        "3. Перешли сюда любой пост из канала.",
        "",
        "После подключения Channel OS проверит права автоматически.",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action("onboarding:create", async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_DRAFT_CONTENT"
    );

    return ctx.reply(
      [
        "✍️ Создание первого поста",
        "",
        "Отправь текст, фото, видео, GIF или документ.",
        "Сообщение будет сохранено как черновик.",
        "",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action("onboarding:complete", async (ctx) => {
    await ctx.answerCbQuery("Настройка завершена");
    await completeOnboarding(ctx.from);
    return renderDashboard(ctx, { edit: true });
  });
}

module.exports = {
  registerOnboardingHandler,
  renderOnboarding
};
