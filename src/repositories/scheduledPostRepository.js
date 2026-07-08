const prisma = require("../config/prisma");

async function createScheduledPost(data) {
  return prisma.scheduledPost.create({ data });
}

async function listPendingByOwner(ownerId) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);

  return prisma.scheduledPost.findMany({
    where: { channelId: { in: channelIds }, status: "pending" },
    include: { channel: true },
    orderBy: { scheduledAt: "asc" },
    take: 20
  });
}

async function findDuePosts() {
  return prisma.scheduledPost.findMany({
    where: { status: "pending", scheduledAt: { lte: new Date() } },
    include: { channel: true },
    orderBy: { scheduledAt: "asc" },
    take: 10
  });
}

async function markPublished(id) {
  return prisma.scheduledPost.update({ where: { id }, data: { status: "published", publishedAt: new Date() } });
}

async function markFailed(id) {
  return prisma.scheduledPost.update({ where: { id }, data: { status: "failed" } });
}

async function countPendingByOwner(ownerId) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);
  return prisma.scheduledPost.count({ where: { channelId: { in: channelIds }, status: "pending" } });
}

module.exports = { createScheduledPost, listPendingByOwner, findDuePosts, markPublished, markFailed, countPendingByOwner };
