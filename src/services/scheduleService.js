const { upsertUser } = require("../repositories/userRepository");
const {
  findDraft,
  deleteDraft
} = require("../repositories/draftRepository");
const scheduledRepository = require("../repositories/scheduledPostRepository");
const { extractDraftContent } = require("./draftService");

function parseDateTimeRu(input) {
  const match = String(input)
    .trim()
    .match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) return null;

  const [, dd, mm, yyyy, hh, min] = match;
  const date = new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
    0
  );

  if (Number.isNaN(date.getTime())) return null;

  if (
    date.getFullYear() !== Number(yyyy) ||
    date.getMonth() !== Number(mm) - 1 ||
    date.getDate() !== Number(dd) ||
    date.getHours() !== Number(hh) ||
    date.getMinutes() !== Number(min)
  ) {
    return null;
  }

  if (date.getTime() <= Date.now()) return null;

  return date;
}

function startOfDay(date = new Date()) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextOccurrence(date, recurrence) {
  const next = new Date(date);

  if (recurrence === "daily") {
    next.setDate(next.getDate() + 1);
    return next;
  }

  if (recurrence === "weekly") {
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (recurrence === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }

  return null;
}

function isNextOccurrenceAllowed(item, nextDate) {
  if (!nextDate) return false;
  if (!item.recurrenceUntil) return true;

  return nextDate <= new Date(item.recurrenceUntil);
}

async function scheduleDraft(from, draftId, scheduledAt) {
  const user = await upsertUser(from);
  const draft = await findDraft({
    userId: user.id,
    draftId
  });

  if (!draft) {
    return {
      ok: false,
      message: "❌ Черновик не найден."
    };
  }

  if (!draft.channel) {
    return {
      ok: false,
      message: "❌ Сначала выбери канал."
    };
  }

  const scheduled = await scheduledRepository.createScheduledPost({
    channelId: draft.channel.id,
    type: draft.type,
    text: draft.text,
    fileId: draft.fileId,
    caption: draft.caption,
    category: draft.category,
    scheduledAt,
    recurrence: "none",
    reminderMinutes: 30
  });

  await deleteDraft({
    userId: user.id,
    draftId: draft.id
  });

  return {
    ok: true,
    scheduled,
    channel: draft.channel
  };
}

async function listUserScheduled(from) {
  const user = await upsertUser(from);
  return scheduledRepository.listPendingByOwner(user.id);
}

async function getScheduledForUser(from, scheduledId) {
  const user = await upsertUser(from);

  return scheduledRepository.findScheduledForOwner(
    user.id,
    scheduledId
  );
}

async function rescheduleForUser(from, scheduledId, scheduledAt) {
  const user = await upsertUser(from);

  return scheduledRepository.updateScheduledForOwner(
    user.id,
    scheduledId,
    {
      scheduledAt,
      reminderSentAt: null,
      status: "pending",
      failureReason: null
    }
  );
}

async function updateScheduledContent(from, scheduledId, message) {
  const content = extractDraftContent(message);

  if (!content) return null;

  const user = await upsertUser(from);

  return scheduledRepository.updateScheduledForOwner(
    user.id,
    scheduledId,
    {
      type: content.type,
      text: content.text || null,
      fileId: content.fileId || null,
      caption: content.caption || null
    }
  );
}

async function setScheduledRecurrence(
  from,
  scheduledId,
  recurrence
) {
  const allowed = ["none", "daily", "weekly", "monthly"];

  if (!allowed.includes(recurrence)) return null;

  const user = await upsertUser(from);

  return scheduledRepository.updateScheduledForOwner(
    user.id,
    scheduledId,
    { recurrence }
  );
}

async function setScheduledReminder(
  from,
  scheduledId,
  reminderMinutes
) {
  const minutes = Number(reminderMinutes);
  const allowed = [0, 15, 30, 60];

  if (!allowed.includes(minutes)) return null;

  const user = await upsertUser(from);

  return scheduledRepository.updateScheduledForOwner(
    user.id,
    scheduledId,
    {
      reminderMinutes: minutes,
      reminderSentAt: null
    }
  );
}

async function setScheduledCategory(
  from,
  scheduledId,
  category
) {
  const user = await upsertUser(from);

  return scheduledRepository.updateScheduledForOwner(
    user.id,
    scheduledId,
    {
      category: String(category).trim().slice(0, 60) || null
    }
  );
}

async function cancelScheduledForUser(from, scheduledId) {
  const user = await upsertUser(from);

  return scheduledRepository.cancelScheduledForOwner(
    user.id,
    scheduledId
  );
}

module.exports = {
  parseDateTimeRu,
  startOfDay,
  addDays,
  getNextOccurrence,
  isNextOccurrenceAllowed,
  scheduleDraft,
  listUserScheduled,
  getScheduledForUser,
  rescheduleForUser,
  updateScheduledContent,
  setScheduledRecurrence,
  setScheduledReminder,
  setScheduledCategory,
  cancelScheduledForUser
};
