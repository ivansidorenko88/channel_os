const prisma = require("../config/prisma");

async function upsertChannel({ ownerId, telegramId, title, username }) {
  return prisma.channel.upsert({
    where: {
      ownerId_telegramId: {
        ownerId,
        telegramId: String(telegramId)
      }
    },
    update: {
      title,
      username: username || null
    },
    create: {
      ownerId,
      telegramId: String(telegramId),
      title,
      username: username || null
    }
  });
}

async function listChannels(ownerId) {
  return prisma.channel.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" }
  });
}

async function findChannel(ownerId, channelId) {
  return prisma.channel.findFirst({
    where: {
      ownerId,
      id: Number(channelId)
    }
  });
}

module.exports = {
  upsertChannel,
  listChannels,
  findChannel
};
