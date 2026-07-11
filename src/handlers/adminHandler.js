const {
  isAdminContext,
  getAdminAccessDiagnostics
} = require("../utils/adminAccess");
const { buildAdminStatistics } = require("../services/adminService");
const { adminKeyboard } = require("../keyboards/adminKeyboard");

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

async function denyAccess(ctx) {
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery("Нет доступа", { show_alert: true });
    return;
  }

  return ctx.reply("⛔️ Эта команда доступна только администратору бота.");
}

async function renderAdminPanel(ctx, edit = false) {
  if (!isAdminContext(ctx)) {
    return denyAccess(ctx);
  }

  const { text } = await buildAdminStatistics();

  if (edit && ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(text, adminKeyboard());
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, adminKeyboard());
}

function registerAdminHandler(bot) {
  bot.command("myid", async (ctx) => {
    return ctx.reply(
      [
        "🪪 Твой Telegram ID:",
        "",
        `<code>${ctx.from.id}</code>`,
        "",
        "Добавь его в ADMIN_IDS на BotHost."
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  });


bot.command("admin_check", async (ctx) => {
  const diagnostics = getAdminAccessDiagnostics(ctx.from.id);

  return ctx.reply(
    [
      "🛡 Проверка доступа администратора",
      "",
      `Твой Telegram ID: ${diagnostics.telegramId}`,
      `ADMIN_IDS найден в окружении: ${diagnostics.environmentValuePresent ? "да" : "нет"}`,
      `Распознано администраторов: ${diagnostics.configuredAdminCount}`,
      `Доступ: ${diagnostics.hasAccess ? "✅ разрешён" : "❌ запрещён"}`,
      "",
      diagnostics.hasAccess
        ? "Теперь команда /admin должна открываться."
        : "Сверь Telegram ID, значение ADMIN_IDS и обязательно перезапусти контейнер."
    ].join("\n")
  );
});

  bot.command("admin", async (ctx) => {
    return renderAdminPanel(ctx);
  });

  bot.command("admin_stats", async (ctx) => {
    return renderAdminPanel(ctx);
  });

  bot.action("admin:refresh", async (ctx) => {
    if (!isAdminContext(ctx)) {
      return denyAccess(ctx);
    }

    await ctx.answerCbQuery("Статистика обновлена");
    return renderAdminPanel(ctx, true);
  });
}

module.exports = {
  registerAdminHandler
};
