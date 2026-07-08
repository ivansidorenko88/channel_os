const prisma = require("../config/prisma");

async function createPublishedPost(data) {
  return prisma.post.create({
    data: {
      ...data,
      status: "published",
      publishedAt: new Date()
    }
  });
}

async function countPostsByOwner(ownerId) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);

  return prisma.post.count({ where: { channelId: { in: channelIds } } });
}

module.exports = { createPublishedPost, countPostsByOwner };
