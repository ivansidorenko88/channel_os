const prisma = require("../config/prisma");

async function createAnalyticsSnapshot(data) {
  return prisma.analyticsSnapshot.create({ data });
}

async function latestAnalyticsSnapshot(channelId) {
  return prisma.analyticsSnapshot.findFirst({
    where: { channelId },
    orderBy: { createdAt: "desc" }
  });
}

async function firstAnalyticsSnapshotSince(channelId, since) {
  return prisma.analyticsSnapshot.findFirst({
    where: {
      channelId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" }
  });
}

async function listAnalyticsSnapshotsSince(channelId, since) {
  return prisma.analyticsSnapshot.findMany({
    where: {
      channelId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: "asc" }
  });
}

async function countDraftsForChannel(channelId) {
  return prisma.draft.count({ where: { channelId } });
}

async function countPostsForChannel(channelId) {
  return prisma.post.count({ where: { channelId } });
}

async function countScheduledForChannel(channelId) {
  return prisma.scheduledPost.count({
    where: {
      channelId,
      status: "pending"
    }
  });
}

module.exports = {
  createAnalyticsSnapshot,
  latestAnalyticsSnapshot,
  firstAnalyticsSnapshotSince,
  listAnalyticsSnapshotsSince,
  countDraftsForChannel,
  countPostsForChannel,
  countScheduledForChannel
};
