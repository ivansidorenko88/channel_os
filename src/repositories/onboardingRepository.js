const prisma = require("../config/prisma");

async function getOnboardingProgress(userId) {
  const channels = await prisma.channel.findMany({
    where: {
      ownerId: userId,
      isActive: true
    },
    select: { id: true }
  });

  const channelIds = channels.map((channel) => channel.id);

  const [
    draftCount,
    postCount,
    scheduledCount,
    snapshotCount
  ] = await Promise.all([
    prisma.draft.count({
      where: {
        userId,
        status: "draft"
      }
    }),
    channelIds.length
      ? prisma.post.count({
          where: {
            channelId: { in: channelIds }
          }
        })
      : 0,
    channelIds.length
      ? prisma.scheduledPost.count({
          where: {
            channelId: { in: channelIds },
            status: { in: ["pending", "published"] }
          }
        })
      : 0,
    channelIds.length
      ? prisma.analyticsSnapshot.count({
          where: {
            channelId: { in: channelIds }
          }
        })
      : 0
  ]);

  return {
    channelCount: channelIds.length,
    draftCount,
    postCount,
    scheduledCount,
    snapshotCount
  };
}

module.exports = {
  getOnboardingProgress
};
