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

async function countPostsByOwnerSince(ownerId, since) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);
  return prisma.post.count({
    where: {
      channelId: { in: channelIds },
      publishedAt: { gte: since }
    }
  });
}

async function countPostsByChannel(channelId, since = null) {
  return prisma.post.count({
    where: {
      channelId,
      ...(since ? { publishedAt: { gte: since } } : {})
    }
  });
}

async function lastPostByChannel(channelId) {
  return prisma.post.findFirst({
    where: { channelId },
    orderBy: { publishedAt: "desc" }
  });
}

module.exports = { createPublishedPost, countPostsByOwner, countPostsByOwnerSince, countPostsByChannel, lastPostByChannel };
