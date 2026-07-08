const prisma = require("../config/prisma");

async function createPublishedPost({ channelId, telegramMessageId, text }) {
  return prisma.post.create({
    data: {
      channelId,
      telegramMessageId,
      text,
      status: "published",
      publishedAt: new Date()
    }
  });
}

async function countPostsByOwner(ownerId) {
  const channels = await prisma.channel.findMany({
    where: { ownerId },
    select: { id: true }
  });

  const channelIds = channels.map((channel) => channel.id);

  return prisma.post.count({
    where: {
      channelId: {
        in: channelIds
      }
    }
  });
}

module.exports = {
  createPublishedPost,
  countPostsByOwner
};
