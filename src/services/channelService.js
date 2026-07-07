const { upsertFromTelegramUser } = require("../repositories/userRepository");
const { upsertChannelForUser, listUserChannels } = require("../repositories/channelRepository");
async function connectChannelFromForward(ctx) {
  const forwardedChat = ctx.message.forward_from_chat;
  if (!forwardedChat || forwardedChat.type !== "channel") return { ok: false, message: "❌ Нужно переслать сообщение именно из Telegram-канала." };
  const user = await upsertFromTelegramUser(ctx.from);
  const channel = await upsertChannelForUser({ ownerId: user.id, telegramId: String(forwardedChat.id), title: forwardedChat.title, username: forwardedChat.username || null });
  return { ok: true, channel };
}
async function getUserChannels(ctx) {
  const user = await upsertFromTelegramUser(ctx.from);
  return listUserChannels(user.id);
}
module.exports = { connectChannelFromForward, getUserChannels };
