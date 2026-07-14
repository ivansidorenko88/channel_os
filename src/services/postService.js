const { upsertUser } = require("../repositories/userRepository");
const {
  claimDraftForPublish,
  releaseDraftPublish,
  markDraftPublicationUncertain,
  countDrafts
} = require("../repositories/draftRepository");
const {
  completeDraftPublication,
  countPostsByOwner
} = require("../repositories/postRepository");
const {
  listChannels
} = require("../repositories/channelRepository");
const {
  countPendingByOwner
} = require("../repositories/scheduledPostRepository");
const {
  sendContent
} = require("./telegramPublishService");

async function publishDraft(ctx, draftId) {
  const user = await upsertUser(ctx.from);
  const draft = await claimDraftForPublish({
    userId: user.id,
    draftId
  });

  if (!draft) {
    return {
      ok: false,
      message:
        "❌ Черновик не найден или уже публикуется."
    };
  }

  if (!draft.channel || !draft.channel.isActive) {
    await releaseDraftPublish({
      userId: user.id,
      draftId
    });

    return {
      ok: false,
      message: "❌ Сначала выбери активный канал."
    };
  }

  let sent;

  try {
    sent = await sendContent(
      ctx.telegram,
      draft.channel.telegramId,
      draft
    );
  } catch (error) {
    await releaseDraftPublish({
      userId: user.id,
      draftId: draft.id
    });

    throw error;
  }

  try {
    const post = await completeDraftPublication({
      userId: user.id,
      draftId: draft.id,
      postData: {
        channelId: draft.channel.id,
        telegramMessageId: sent.message_id,
        type: draft.type,
        text: draft.text,
        fileId: draft.fileId,
        caption: draft.caption,
        category: draft.category
      }
    });

    return {
      ok: true,
      channel: draft.channel,
      post
    };
  } catch (error) {
    await markDraftPublicationUncertain({
      userId: user.id,
      draftId: draft.id
    });

    console.error(
      "Draft was sent to Telegram but database completion failed:",
      error
    );

    return {
      ok: false,
      message:
        "⚠️ Telegram принял сообщение, но Channel OS не смог подтвердить сохранение результата. Проверь канал вручную — повторно публиковать этот черновик не нужно."
    };
  }
}

async function getBasicStats(from) {
  const user = await upsertUser(from);
  const channels = await listChannels(user.id);
  const postCount = await countPostsByOwner(user.id);
  const draftCount = await countDrafts(user.id);
  const scheduledCount = await countPendingByOwner(user.id);

  return {
    user,
    channelCount: channels.length,
    postCount,
    draftCount,
    scheduledCount
  };
}

module.exports = {
  publishDraft,
  getBasicStats
};
