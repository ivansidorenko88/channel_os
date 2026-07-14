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


async function completeDraftPublication({
  userId,
  draftId,
  postData
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        ...postData,
        status: "published",
        publishedAt: new Date()
      }
    });

    await tx.draft.deleteMany({
      where: {
        id: Number(draftId),
        userId: Number(userId),
        status: "publishing"
      }
    });

    return post;
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

module.exports = {
  createPublishedPost,
  completeDraftPublication,
  countPostsByOwner,
  countPostsByOwnerSince,
  countPostsByChannel,
  lastPostByChannel
};
