const {
  mainMenu,
  backToMenu
} = require("../keyboards/mainMenu");
const {
  setState,
  getState,
  clearState
} = require("../middleware/state");
const {
  connectChannelFromForward,
  getUserChannels,
  getManagedChannel,
  removeUserChannel
} = require("../services/channelService");
const {
  channelListKeyboard,
  channelActionsKeyboard,
  channelDeleteConfirmKeyboard
} = require("../keyboards/channelKeyboards");
const {
  buildChannelCard
} = require("../utils/channelFormatter");

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

async function showScreen(ctx, text, keyboard) {
  if (ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(
        text,
        keyboard
      );
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

async function renderChannels(ctx) {
  const channels = await getUserChannels(ctx.from);

  if (!channels.length) {
    return showScreen(
      ctx,
      [
        "📢 Мои каналы",
        "",
        "Подключённых каналов пока нет.",
        "Добавь бота администратором и перешли сюда пост из канала."
      ].join("\n"),
      channelListKeyboard([])
    );
  }

  return showScreen(
    ctx,
    [
      "📢 Мои каналы",
      "",
      `Подключено: ${channels.length}`,
      "",
      "Выбери канал для управления:"
    ].join("\n"),
    channelListKeyboard(channels)
  );
}

function registerChannelHandler(bot) {
  bot.command("channels", async (ctx) => {
    return renderChannels(ctx);
  });

  bot.action("channels:add", async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_CHANNEL_FORWARD"
    );

    await ctx.reply(
      [
        "➕ Добавление канала",
        "",
        "1. Добавь бота администратором в канал.",
        "2. Дай право публиковать сообщения.",
        "3. Оставь бота администратором для аналитики.",
        "4. Перешли сюда любой пост из канала.",
        "",
        "Для отмены нажми /cancel"
      ].join("\n"),
      backToMenu()
    );
  });

  bot.action("channels:list", async (ctx) => {
    await ctx.answerCbQuery();
    return renderChannels(ctx);
  });

  bot.action(
    /^channels:view:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = await getManagedChannel(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!data || !data.channel.isActive) {
        return renderChannels(ctx);
      }

      return showScreen(
        ctx,
        buildChannelCard(data),
        channelActionsKeyboard(data.channel.id)
      );
    }
  );

  bot.action(
    /^channels:delete_confirm:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const data = await getManagedChannel(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!data || !data.channel.isActive) {
        return renderChannels(ctx);
      }

      return showScreen(
        ctx,
        [
          "🗑 Удалить канал из Channel OS?",
          "",
          `📢 ${data.channel.title}`,
          "",
          "Будет выполнено:",
          "• канал перестанет отображаться в Dashboard;",
          "• сбор аналитики остановится;",
          "• запланированные публикации будут отменены;",
          "• черновики останутся, но канал у них будет снят;",
          "",
          "Опубликованные посты и история аналитики сохранятся."
        ].join("\n"),
        channelDeleteConfirmKeyboard(
          data.channel.id
        )
      );
    }
  );

  bot.action(
    /^channels:disconnect:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Канал отключён");

      const channel = await removeUserChannel(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!channel) {
        return renderChannels(ctx);
      }

      return showScreen(
        ctx,
        [
          "✅ Канал удалён из Channel OS",
          "",
          `📢 ${channel.title}`,
          "",
          "История аналитики и опубликованные посты сохранены. Канал можно подключить повторно тем же способом."
        ].join("\n"),
        channelListKeyboard(
          await getUserChannels(ctx.from)
        )
      );
    }
  );

  bot.on("message", async (ctx, next) => {
    const currentState = getState(ctx.from.id);

    if (
      !currentState ||
      currentState.state !==
        "WAITING_CHANNEL_FORWARD"
    ) {
      return next();
    }

    const result =
      await connectChannelFromForward(ctx);

    if (!result.ok) {
      return ctx.reply(
        result.message,
        backToMenu()
      );
    }

    clearState(ctx.from.id);

    return ctx.reply(
      [
        "✅ Канал подключён",
        "",
        `📢 ${result.channel.title}`,
        "",
        "Он уже доступен в Dashboard, аналитике и контент-плане."
      ].join("\n"),
      channelActionsKeyboard(result.channel.id)
    );
  });
}

module.exports = {
  registerChannelHandler
};
