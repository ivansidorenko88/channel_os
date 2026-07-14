const {
  upsertUser
} = require("../repositories/userRepository");
const {
  upsertChannel,
  listChannels,
  getChannelManagementStats,
  disconnectChannel,
  recordChannelPermissionCheck
} = require("../repositories/channelRepository");
const {
  checkChannelPermissions
} = require("./channelPermissionService");

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

  let permissions = null;

  try {
    permissions = await checkChannelPermissions(
      ctx.telegram,
      channel.telegramId
    );

    await recordChannelPermissionCheck(
      user.id,
      channel.id,
      permissions
    );
  } catch (error) {
    permissions = {
      ok: false,
      summary: error.message,
      error: error.message
    };

    await recordChannelPermissionCheck(
      user.id,
      channel.id,
      permissions
    );
  }

  return { ok: true, channel, permissions };
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

async function checkManagedChannelPermissions(
  telegram,
  from,
  channelId
) {
  const user = await upsertUser(from);
  const data = await getChannelManagementStats(
    user.id,
    channelId
  );

  if (!data || !data.channel.isActive) return null;

  const result = await checkChannelPermissions(
    telegram,
    data.channel.telegramId
  );

  await recordChannelPermissionCheck(
    user.id,
    data.channel.id,
    result
  );

  return {
    channel: data.channel,
    result
  };
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
  checkManagedChannelPermissions,
  removeUserChannel
};
