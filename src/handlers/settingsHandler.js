const {
  setState,
  getState,
  clearState
} = require("../middleware/state");
const {
  getSettings,
  setDefaultReminder,
  toggleNotifications,
  togglePublishConfirmation,
  setDefaultCategory,
  clearDefaultCategory,
  resetSettings
} = require("../services/settingsService");
const {
  settingsKeyboard,
  reminderSettingsKeyboard,
  categorySettingsKeyboard,
  resetSettingsKeyboard
} = require("../keyboards/settingsKeyboard");
const {
  buildSettingsText
} = require("../utils/settingsFormatter");

function isEditFallbackError(error) {
  const description =
    error?.response?.description ||
    error?.message ||
    "";

  return (
    description.includes("message is not modified") ||
    description.includes("message can't be edited") ||
    description.includes("message to edit not found")
  );
}

async function showSettings(ctx, edit = true) {
  const settings = await getSettings(ctx.from);
  const text = buildSettingsText(settings);
  const keyboard = settingsKeyboard(settings);

  if (edit && ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(text, keyboard);
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

function registerSettingsHandler(bot) {
  bot.command("settings", async (ctx) => {
    return showSettings(ctx, false);
  });

  bot.action("settings:main", async (ctx) => {
    await ctx.answerCbQuery();
    return showSettings(ctx);
  });

  bot.action("settings:reminder", async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.editMessageText(
      [
        "🔔 Напоминание по умолчанию",
        "",
        "Выбери, за сколько времени предупреждать о новых запланированных публикациях."
      ].join("\n"),
      reminderSettingsKeyboard()
    );
  });

  bot.action(
    /^settings:set_reminder:(0|15|30|60)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Настройка сохранена");

      await setDefaultReminder(
        ctx.from,
        Number(ctx.match[1])
      );

      return showSettings(ctx);
    }
  );

  bot.action(
    "settings:toggle_notifications",
    async (ctx) => {
      await ctx.answerCbQuery("Настройка сохранена");
      await toggleNotifications(ctx.from);
      return showSettings(ctx);
    }
  );

  bot.action(
    "settings:toggle_confirmation",
    async (ctx) => {
      await ctx.answerCbQuery("Настройка сохранена");
      await togglePublishConfirmation(ctx.from);
      return showSettings(ctx);
    }
  );

  bot.action("settings:category", async (ctx) => {
    await ctx.answerCbQuery();

    const settings = await getSettings(ctx.from);

    setState(
      ctx.from.id,
      "WAITING_DEFAULT_CATEGORY"
    );

    return ctx.reply(
      [
        "🏷 Рубрика по умолчанию",
        "",
        "Отправь название рубрики.",
        "Она будет автоматически добавляться к новым черновикам.",
        "",
        "Для отмены нажми /cancel"
      ].join("\n"),
      categorySettingsKeyboard(
        Boolean(settings.defaultCategory)
      )
    );
  });

  bot.action(
    "settings:clear_category",
    async (ctx) => {
      await ctx.answerCbQuery("Рубрика удалена");
      clearState(ctx.from.id);
      await clearDefaultCategory(ctx.from);
      return showSettings(ctx, false);
    }
  );

  bot.action(
    "settings:reset_confirm",
    async (ctx) => {
      await ctx.answerCbQuery();

      return ctx.editMessageText(
        [
          "♻️ Сбросить настройки?",
          "",
          "Будут восстановлены:",
          "• напоминание за 30 минут;",
          "• уведомления включены;",
          "• подтверждение публикации включено;",
          "• рубрика по умолчанию удалена."
        ].join("\n"),
        resetSettingsKeyboard()
      );
    }
  );

  bot.action("settings:reset", async (ctx) => {
    await ctx.answerCbQuery("Настройки сброшены");
    await resetSettings(ctx.from);
    return showSettings(ctx);
  });

  bot.on("text", async (ctx, next) => {
    const currentState = getState(ctx.from.id);

    if (
      !currentState ||
      currentState.state !==
        "WAITING_DEFAULT_CATEGORY"
    ) {
      return next();
    }

    await setDefaultCategory(
      ctx.from,
      ctx.message.text
    );

    clearState(ctx.from.id);

    return ctx.reply(
      "✅ Рубрика по умолчанию сохранена.",
      settingsKeyboard(
        await getSettings(ctx.from)
      )
    );
  });
}

module.exports = {
  registerSettingsHandler
};
