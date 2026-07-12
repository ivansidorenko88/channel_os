const prisma = require("../config/prisma");

async function upsertChannel({
  ownerId,
  telegramId,
  title,
  username
}) {
  return prisma.channel.upsert({
    where: {
      ownerId_telegramId: {
        ownerId,
        telegramId: String(telegramId)
      }
    },
    update: {
      title,
      username: username || null,
      isActive: true,
      disconnectedAt: null
    },
    create: {
      ownerId,
      telegramId: String(telegramId),
      title,
      username: username || null,
      isActive: true
    }
  });
}

async function listChannels(ownerId) {
  return prisma.channel.findMany({
    where: {
      ownerId,
      isActive: true
    },
    orderBy: { createdAt: "desc" }
  });
}

async function findChannel(ownerId, channelId) {
  return prisma.channel.findFirst({
    where: {
      ownerId,
      id: Number(channelId),
      isActive: true
    }
  });
}

async function findChannelForManagement(ownerId, channelId) {
  return prisma.channel.findFirst({
    where: {
      ownerId,
      id: Number(channelId)
    }
  });
}

async function findChannelByTelegramId(telegramId) {
  return prisma.channel.findFirst({
    where: {
      telegramId: String(telegramId),
      isActive: true
    }
  });
}

async function listAllChannels() {
  return prisma.channel.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }
  });
}

async function getChannelManagementStats(ownerId, channelId) {
  const channel = await findChannelForManagement(
    ownerId,
    channelId
  );

  if (!channel) return null;

  const [
    postCount,
    draftCount,
    scheduledCount,
    snapshotCount
  ] = await Promise.all([
    prisma.post.count({
      where: { channelId: channel.id }
    }),
    prisma.draft.count({
      where: { channelId: channel.id }
    }),
    prisma.scheduledPost.count({
      where: {
        channelId: channel.id,
        status: "pending"
      }
    }),
    prisma.analyticsSnapshot.count({
      where: { channelId: channel.id }
    })
  ]);

  return {
    channel,
    postCount,
    draftCount,
    scheduledCount,
    snapshotCount
  };
}

async function disconnectChannel(ownerId, channelId) {
  const channel = await findChannel(ownerId, channelId);

  if (!channel) return null;

  return prisma.$transaction(async (tx) => {
    await tx.scheduledPost.updateMany({
      where: {
        channelId: channel.id,
        status: "pending"
      },
      data: {
        status: "cancelled",
        failureReason: "Канал отключён владельцем"
      }
    });

    await tx.draft.updateMany({
      where: { channelId: channel.id },
      data: { channelId: null }
    });

    return tx.channel.update({
      where: { id: channel.id },
      data: {
        isActive: false,
        disconnectedAt: new Date()
      }
    });
  });
}

module.exports = {
  upsertChannel,
  listChannels,
  findChannel,
  findChannelForManagement,
  findChannelByTelegramId,
  listAllChannels,
  getChannelManagementStats,
  disconnectChannel
};
