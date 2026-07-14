const { isExpiredCallbackError } = require("../utils/safeCallback");
const {
  dashboardKeyboard,
  dashboardBackKeyboard
} = require("../keyboards/dashboardKeyboard");
const {
  getDashboardData,
  refreshDashboard
} = require("../services/dashboardService");
const {
  buildDashboardText,
  buildRefreshResultText
} = require("../utils/dashboardFormatter");
const { listUserDraftsPage } = require("../services/draftService");
const { draftListKeyboard } = require("../keyboards/draftKeyboards");
const { buildDraftListText } = require("../utils/draftFormatter");

async function acknowledge(ctx, text) {
  if (!ctx.callbackQuery) return;

  try {
    await ctx.answerCbQuery(text);
  } catch (error) {
    if (!isExpiredCallbackError(error)) throw error;
    console.warn(
      `[Dashboard] Ignored expired callback: ${ctx.callbackQuery.id}`
    );
  }
}

function isEditError(error) {
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

async function renderDashboard(ctx, options = {}) {
  const data = await getDashboardData(ctx.from);
  const text = buildDashboardText(data);
  const keyboard = dashboardKeyboard();

  if (options.edit && ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(text, keyboard);
    } catch (error) {
      if (!isEditError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

function draftPreview(draft) {
  const content =
    draft.text ||
    draft.caption ||
    `[${draft.type}]`;

  const compact = String(content).replace(/\s+/g, " ").slice(0, 80);
  const channel = draft.channel?.title || "канал не выбран";

  const category = draft.category ? ` · 🏷 ${draft.category}` : "";

  return `#${draft.id} · ${channel}${category}\n${compact}`;
}

function registerDashboardHandler(bot) {
  bot.command("dashboard", async (ctx) => {
    return renderDashboard(ctx);
  });

  bot.action("dashboard:open", async (ctx) => {
    await acknowledge(ctx);
    return renderDashboard(ctx, { edit: true });
  });

  bot.action("menu:main", async (ctx) => {
    await acknowledge(ctx);
    return renderDashboard(ctx, { edit: true });
  });

  bot.action("dashboard:refresh", async (ctx) => {
    await acknowledge(ctx, "Обновляю данные...");

    const { refreshResult, data } = await refreshDashboard(
      ctx.telegram,
      ctx.from
    );

    const text = [
      buildDashboardText(data),
      "",
      `🔄 ${buildRefreshResultText(refreshResult)}`
    ].join("\n");

    try {
      return await ctx.editMessageText(text, dashboardKeyboard());
    } catch (error) {
      if (!isEditError(error)) throw error;
      return ctx.reply(text, dashboardKeyboard());
    }
  });

  bot.action("dashboard:drafts", async (ctx) => {
    await acknowledge(ctx);

    const result = await listUserDraftsPage(ctx.from, {
      page: 0,
      pageSize: 6
    });

    return ctx.reply(
      buildDraftListText(result),
      draftListKeyboard(result)
    );
  });
}

module.exports = {
  registerDashboardHandler,
  renderDashboard
};
