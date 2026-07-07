const { mainMenu, backToMenu } = require("../keyboards/mainMenu");
const { setState, clearState, getState } = require("../middleware/sessionState");
const { connectChannelFromForward, getUserChannels } = require("../services/channelService");
const { escapeHtml } = require("../utils/format");
function registerChannelHandler(bot) {
  bot.action("channels:add", async (ctx) => {
    await ctx.answerCbQuery();
    setState(ctx.from.id, "WAITING_CHANNEL_FORWARD");
    await ctx.reply(["➕ Добавление канала", "", "1. Добавь бота администратором в канал.", "2. Дай ему право публиковать сообщения.", "3. Перешли сюда любой пост из этого канала."].join("\n"), backToMenu());
  });
  bot.action("channels:list", async (ctx) => {
    await ctx.answerCbQuery();
    const channels = await getUserChannels(ctx);
    if (!channels.length) return ctx.reply("📢 У тебя пока нет подключенных каналов.", mainMenu());
    const text = channels.map((channel, index) => `${index + 1}. ${escapeHtml(channel.title)}\nID: ${channel.telegramId}\nUsername: ${channel.username ? "@" + channel.username : "без username"}`).join("\n\n");
    return ctx.replyWithHTML(`📢 <b>Мои каналы</b>\n\n${text}`, mainMenu());
  });
  bot.on("message", async (ctx, next) => {
    const state = getState(ctx.from.id);
    if (state !== "WAITING_CHANNEL_FORWARD") return next();
    const result = await connectChannelFromForward(ctx);
    if (!result.ok) return ctx.reply(result.message, backToMenu());
    clearState(ctx.from.id);
    return ctx.reply(`✅ Канал подключен:\n\n📢 ${result.channel.title}`, mainMenu());
  });
}
module.exports = { registerChannelHandler };
