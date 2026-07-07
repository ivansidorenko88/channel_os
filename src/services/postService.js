const { upsertFromTelegramUser } = require("../repositories/userRepository");
const { createDraft, findDraftForUser, deleteDraft } = require("../repositories/draftRepository");
const { createPublishedPost } = require("../repositories/postRepository");
async function saveTextDraft(ctx) {
  const user = await upsertFromTelegramUser(ctx.from);
  return createDraft({ userId: user.id, text: ctx.message.text });
}
async function publishDraft(ctx, draftId) {
  const user = await upsertFromTelegramUser(ctx.from);
  const draft = await findDraftForUser(draftId, user.id);
  if (!draft) return { ok: false, message: "❌ Черновик не найден." };
  if (!draft.channel) return { ok: false, message: "❌ Сначала выбери канал для публикации." };
  const sent = await ctx.telegram.sendMessage(draft.channel.telegramId, draft.text);
  await createPublishedPost({ channelId: draft.channel.id, text: draft.text, telegramMessageId: sent.message_id });
  await deleteDraft(draft.id, user.id);
  return { ok: true, channel: draft.channel, messageId: sent.message_id };
}
module.exports = { saveTextDraft, publishDraft };
