const { readDb, writeDb, nextId } = require("../storage/db");
const { upsertUser } = require("./userService");

function connectChannelFromForward(ctx) {
  const forwardedChat = ctx.message && ctx.message.forward_from_chat;

  if (!forwardedChat || forwardedChat.type !== "channel") {
    return {
      ok: false,
      message: "❌ Нужно переслать сообщение именно из Telegram-канала."
    };
  }

  const user = upsertUser(ctx.from);
  const db = readDb();

  let channel = db.channels.find(
    (item) =>
      item.ownerId === user.id &&
      item.telegramId === String(forwardedChat.id)
  );

  if (!channel) {
    channel = {
      id: nextId(db.channels),
      ownerId: user.id,
      telegramId: String(forwardedChat.id),
      title: forwardedChat.title || "Без названия",
      username: forwardedChat.username || null,
      createdAt: new Date().toISOString()
    };

    db.channels.push(channel);
  } else {
    channel.title = forwardedChat.title || channel.title;
    channel.username = forwardedChat.username || null;
  }

  writeDb(db);

  return {
    ok: true,
    channel
  };
}

function getUserChannels(from) {
  const user = upsertUser(from);
  const db = readDb();

  return db.channels.filter((channel) => channel.ownerId === user.id);
}

function getUserChannel(from, channelId) {
  const user = upsertUser(from);
  const db = readDb();

  return db.channels.find(
    (channel) =>
      channel.ownerId === user.id &&
      channel.id === Number(channelId)
  );
}

module.exports = {
  connectChannelFromForward,
  getUserChannels,
  getUserChannel
};
