const { upsertUser } = require("../repositories/userRepository");
const { countDrafts } = require("../repositories/draftRepository");
const {
  countPendingByOwner,
  listPendingByOwner
} = require("../repositories/scheduledPostRepository");
const { countPostsByOwner } = require("../repositories/postRepository");
const {
  getOwnerAnalytics,
  collectOwnerSnapshots
} = require("./analyticsCoreService");
const {
  getAnalyticsSchedulerStatus
} = require("../scheduler/analyticsCoreScheduler");

async function getDashboardData(from) {
  const user = await upsertUser(from);

  const [
    analytics,
    draftCount,
    scheduledCount,
    postCount,
    upcoming
  ] = await Promise.all([
    getOwnerAnalytics(user.id),
    countDrafts(user.id),
    countPendingByOwner(user.id),
    countPostsByOwner(user.id),
    listPendingByOwner(user.id)
  ]);

  const scheduler = getAnalyticsSchedulerStatus();

  return {
    user,
    analytics,
    draftCount,
    scheduledCount,
    postCount,
    nextPublication: upcoming[0] || null,
    scheduler
  };
}

async function refreshDashboard(telegram, from) {
  const user = await upsertUser(from);
  const refreshResult = await collectOwnerSnapshots(telegram, user.id);
  const data = await getDashboardData(from);

  return {
    refreshResult,
    data
  };
}

module.exports = {
  getDashboardData,
  refreshDashboard
};
