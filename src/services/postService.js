const { readDb, writeDb, nextId } = require("../storage/db");
const { getUserChannel } = require("./channelService");
const { getDraft, deleteDraft } = require("./draftService");

async function publishDraft(ctx, draftId) {
  const draft = getDraft(ctx.from, draftId);

  if (!draft) {
    return {
      ok: false,
      message: "❌ Черновик не найден."
    };
  }

  if (!draft.channelId) {
    return {
      ok: false,
      message: "❌ Сначала выбери канал для публикации."
    };
  }

  const channel = getUserChannel(ctx.from, draft.channelId);

  if (!channel) {
    return {
      ok: false,
      message: "❌ Канал не найден."
    };
  }

  const sent = await ctx.telegram.sendMessage(channel.telegramId, draft.text);

  const db = readDb();

  const post = {
    id: nextId(db.posts),
    channelId: channel.id,
    telegramMessageId: sent.message_id,
    text: draft.text,
    status: "published",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString()
  };

  db.posts.push(post);
  writeDb(db);

  deleteDraft(ctx.from, draft.id);

  return {
    ok: true,
    channel,
    post
  };
}

function getStats(from) {
  const { upsertUser } = require("./userService");
  const user = upsertUser(from);
  const db = readDb();

  const channels = db.channels.filter((channel) => channel.ownerId === user.id);
  const channelIds = channels.map((channel) => channel.id);
  const posts = db.posts.filter((post) => channelIds.includes(post.channelId));

  return {
    channelCount: channels.length,
    postCount: posts.length,
    draftCount: db.drafts.filter((draft) => draft.userId === user.id).length
  };
}

module.exports = {
  publishDraft,
  getStats
};
