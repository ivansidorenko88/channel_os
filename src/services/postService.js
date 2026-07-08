const { upsertUser } = require("../repositories/userRepository");
const { findDraft, deleteDraft, countDrafts } = require("../repositories/draftRepository");
const { createPublishedPost, countPostsByOwner } = require("../repositories/postRepository");
const { listChannels } = require("../repositories/channelRepository");

async function publishDraft(ctx, draftId) {
  const user = await upsertUser(ctx.from);

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

  const sent = await ctx.telegram.sendMessage(draft.channel.telegramId, draft.text);

  const post = await createPublishedPost({
    channelId: draft.channel.id,
    telegramMessageId: sent.message_id,
    text: draft.text
  });

  await deleteDraft({
    userId: user.id,
    draftId: draft.id
  });

  return {
    ok: true,
    channel: draft.channel,
    post
  };
}

async function getStats(from) {
  const user = await upsertUser(from);
  const channels = await listChannels(user.id);
  const postCount = await countPostsByOwner(user.id);
  const draftCount = await countDrafts(user.id);

  return {
    channelCount: channels.length,
    postCount,
    draftCount
  };
}

module.exports = {
  publishDraft,
  getStats
};
