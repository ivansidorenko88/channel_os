const { mainMenu, backToMenu } = require("../keyboards/mainMenu");
const { setState, getState, clearState } = require("../middleware/state");
const { connectChannelFromForward, getUserChannels } = require("../services/channelService");
const { safeAnswerCbQuery } = require("../utils/safeCallback");

function registerChannelHandler(bot) {
  bot.action("channels:add", async (ctx) => {
    await safeAnswerCbQuery(ctx);
    setState(ctx.from.id, "WAITING_CHANNEL_FORWARD");

    await ctx.reply(
      [
        "➕ Добавление канала",
        "",
        "1. Добавь бота администратором в канал.",
        "2. Дай право публиковать сообщения.",
        "3. Для подписок/отписок оставь бота администратором.",
        "4. Перешли сюда любой пост из этого канала."
      ].join("\n"),
      backToMenu()
    );
  });

  bot.action("channels:list", async (ctx) => {
    await safeAnswerCbQuery(ctx);
    const channels = await getUserChannels(ctx.from);

    if (!channels.length) return ctx.reply("📢 У тебя пока нет подключенных каналов.", mainMenu());

    const text = channels.map((channel, index) => {
      const username = channel.username ? `@${channel.username}` : "без username";
      return `${index + 1}. ${channel.title}\nID: ${channel.telegramId}\nUsername: ${username}`;
    }).join("\n\n");

    return ctx.reply(`📢 Мои каналы:\n\n${text}`, mainMenu());
  });

  bot.on("message", async (ctx, next) => {
    const currentState = getState(ctx.from.id);
    if (!currentState || currentState.state !== "WAITING_CHANNEL_FORWARD") return next();

    const result = await connectChannelFromForward(ctx);

    if (!result.ok) return ctx.reply(result.message, backToMenu());

    clearState(ctx.from.id);
    return ctx.reply(`✅ Канал подключен:\n\n📢 ${result.channel.title}`, mainMenu());
  });
}

module.exports = { registerChannelHandler };
