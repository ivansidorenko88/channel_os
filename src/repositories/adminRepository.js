const prisma = require("../config/prisma");

function sinceHours(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function sinceDays(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function getAdminStatistics() {
  const [
    totalUsers,
    users24h,
    users7d,
    users30d,
    usersWithChannels,
    totalChannels,
    totalPosts,
    totalDrafts,
    pendingScheduledPosts,
    lastRegisteredUser
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({
      where: { createdAt: { gte: sinceHours(24) } }
    }),
    prisma.user.count({
      where: { createdAt: { gte: sinceDays(7) } }
    }),
    prisma.user.count({
      where: { createdAt: { gte: sinceDays(30) } }
    }),
    prisma.user.count({
      where: { channels: { some: { isActive: true } } }
    }),
    prisma.channel.count({ where: { isActive: true } }),
    prisma.post.count(),
    prisma.draft.count(),
    prisma.scheduledPost.count({
      where: { status: "pending" }
    }),
    prisma.user.findFirst({
      orderBy: { createdAt: "desc" },
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        createdAt: true
      }
    })
  ]);

  return {
    totalUsers,
    users24h,
    users7d,
    users30d,
    usersWithChannels,
    totalChannels,
    totalPosts,
    totalDrafts,
    pendingScheduledPosts,
    lastRegisteredUser
  };
}

module.exports = {
  getAdminStatistics
};
