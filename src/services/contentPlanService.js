const { upsertUser } = require("../repositories/userRepository");
const scheduledRepository = require("../repositories/scheduledPostRepository");
const { countDrafts } = require("../repositories/draftRepository");
const { countTemplates } = require("../repositories/templateRepository");
const { startOfDay, addDays } = require("./scheduleService");

async function getContentPlanSummary(from) {
  const user = await upsertUser(from);
  const todayStart = startOfDay();
  const tomorrowStart = addDays(todayStart, 1);
  const weekEnd = addDays(todayStart, 7);

  const [
    todayCount,
    weekCount,
    pendingCount,
    recurringCount,
    draftCount,
    templateCount,
    nextItems
  ] = await Promise.all([
    scheduledRepository.countByOwnerRange(
      user.id,
      todayStart,
      tomorrowStart
    ),
    scheduledRepository.countByOwnerRange(
      user.id,
      todayStart,
      weekEnd
    ),
    scheduledRepository.countPendingByOwner(user.id),
    scheduledRepository.countRecurringByOwner(user.id),
    countDrafts(user.id),
    countTemplates(user.id),
    scheduledRepository.listPendingByOwner(user.id, 1)
  ]);

  return {
    user,
    todayCount,
    weekCount,
    pendingCount,
    recurringCount,
    draftCount,
    templateCount,
    nextPublication: nextItems[0] || null
  };
}

async function listContentPlan(from, range = "all") {
  const user = await upsertUser(from);
  const todayStart = startOfDay();

  if (range === "today") {
    return scheduledRepository.listByOwnerRange(
      user.id,
      todayStart,
      addDays(todayStart, 1)
    );
  }

  if (range === "week") {
    return scheduledRepository.listByOwnerRange(
      user.id,
      todayStart,
      addDays(todayStart, 7)
    );
  }

  return scheduledRepository.listPendingByOwner(user.id, 50);
}

module.exports = {
  getContentPlanSummary,
  listContentPlan
};
