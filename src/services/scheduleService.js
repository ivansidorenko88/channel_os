const { upsertUser } = require("../repositories/userRepository");
const { findDraft, deleteDraft } = require("../repositories/draftRepository");
const { createScheduledPost, listPendingByOwner } = require("../repositories/scheduledPostRepository");

function parseDateTimeRu(input) {
  const match = String(input).trim().match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) return null;

  const [, dd, mm, yyyy, hh, min] = match;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min), 0);

  if (Number.isNaN(date.getTime())) return null;
  if (date.getTime() < Date.now()) return null;

  return date;
}

async function scheduleDraft(from, draftId, scheduledAt) {
  const user = await upsertUser(from);
  const draft = await findDraft({ userId: user.id, draftId });

  if (!draft) return { ok: false, message: "❌ Черновик не найден." };
  if (!draft.channel) return { ok: false, message: "❌ Сначала выбери канал." };

  const scheduled = await createScheduledPost({
    channelId: draft.channel.id,
    type: draft.type,
    text: draft.text,
    fileId: draft.fileId,
    caption: draft.caption,
    scheduledAt
  });

  await deleteDraft({ userId: user.id, draftId: draft.id });

  return { ok: true, scheduled, channel: draft.channel };
}

async function listUserScheduled(from) {
  const user = await upsertUser(from);
  return listPendingByOwner(user.id);
}

module.exports = { parseDateTimeRu, scheduleDraft, listUserScheduled };
