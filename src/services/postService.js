const { upsertUser } = require("../repositories/userRepository");
const { findDraft, deleteDraft, countDrafts } = require("../repositories/draftRepository");
const { createPublishedPost, countPostsByOwner } = require("../repositories/postRepository");
const { listChannels } = require("../repositories/channelRepository");
const { countPendingByOwner } = require("../repositories/scheduledPostRepository");
const { sendContent } = require("./telegramPublishService");

async function publishDraft(ctx, draftId) {
  const user = await upsertUser(ctx.from);
  const draft = await findDraft({ userId: user.id, draftId });

  if (!draft) return { ok: false, message: "❌ Черновик не найден." };
  if (!draft.channel) return { ok: false, message: "❌ Сначала выбери канал." };

  const sent = await sendContent(ctx.telegram, draft.channel.telegramId, draft);

  const post = await createPublishedPost({
    channelId: draft.channel.id,
    telegramMessageId: sent.message_id,
    type: draft.type,
    text: draft.text,
    fileId: draft.fileId,
    caption: draft.caption
  });

  await deleteDraft({ userId: user.id, draftId: draft.id });
  return { ok: true, channel: draft.channel, post };
}

async function getBasicStats(from) {
  const user = await upsertUser(from);
  const channels = await listChannels(user.id);
  const postCount = await countPostsByOwner(user.id);
  const draftCount = await countDrafts(user.id);
  const scheduledCount = await countPendingByOwner(user.id);
  return { user, channelCount: channels.length, postCount, draftCount, scheduledCount };
}

module.exports = { publishDraft, getBasicStats };
