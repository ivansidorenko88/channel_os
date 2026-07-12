const {
  upsertUser
} = require("../repositories/userRepository");
const {
  upsertChannel,
  listChannels,
  getChannelManagementStats,
  disconnectChannel
} = require("../repositories/channelRepository");

async function connectChannelFromForward(ctx) {
  const forwardedChat =
    ctx.message && ctx.message.forward_from_chat;

  if (
    !forwardedChat ||
    forwardedChat.type !== "channel"
  ) {
    return {
      ok: false,
      message:
        "❌ Нужно переслать сообщение именно из Telegram-канала."
    };
  }

  const user = await upsertUser(ctx.from);

  const channel = await upsertChannel({
    ownerId: user.id,
    telegramId: String(forwardedChat.id),
    title: forwardedChat.title || "Без названия",
    username: forwardedChat.username || null
  });

  return { ok: true, channel };
}

async function getUserChannels(from) {
  const user = await upsertUser(from);
  return listChannels(user.id);
}

async function getManagedChannel(from, channelId) {
  const user = await upsertUser(from);

  return getChannelManagementStats(
    user.id,
    channelId
  );
}

async function removeUserChannel(from, channelId) {
  const user = await upsertUser(from);

  return disconnectChannel(
    user.id,
    channelId
  );
}

module.exports = {
  connectChannelFromForward,
  getUserChannels,
  getManagedChannel,
  removeUserChannel
};
