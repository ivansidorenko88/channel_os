const prisma = require("../config/prisma");
async function createDraft({ userId, text }) { return prisma.draft.create({ data: { userId, text } }); }
async function setDraftChannel({ draftId, userId, channelId }) {
  return prisma.draft.updateMany({ where: { id: Number(draftId), userId }, data: { channelId: Number(channelId) } });
}
async function findDraftForUser(draftId, userId) {
  return prisma.draft.findFirst({ where: { id: Number(draftId), userId }, include: { channel: true } });
}
async function deleteDraft(draftId, userId) { return prisma.draft.deleteMany({ where: { id: Number(draftId), userId } }); }
module.exports = { createDraft, setDraftChannel, findDraftForUser, deleteDraft };
