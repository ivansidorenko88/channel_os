const prisma = require("../config/prisma");

async function createDraft(data) {
  return prisma.draft.create({ data });
}

async function setDraftChannel({ userId, draftId, channelId }) {
  await prisma.draft.updateMany({
    where: { id: Number(draftId), userId },
    data: { channelId: Number(channelId) }
  });

  return prisma.draft.findFirst({
    where: { id: Number(draftId), userId },
    include: { channel: true }
  });
}

async function findDraft({ userId, draftId }) {
  return prisma.draft.findFirst({
    where: { id: Number(draftId), userId },
    include: { channel: true }
  });
}

async function deleteDraft({ userId, draftId }) {
  return prisma.draft.deleteMany({ where: { id: Number(draftId), userId } });
}

async function listDrafts(userId, take = 10) {
  return prisma.draft.findMany({
    where: { userId },
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
    take
  });
}

async function countDrafts(userId) {
  return prisma.draft.count({ where: { userId } });
}

module.exports = { createDraft, setDraftChannel, findDraft, deleteDraft, listDrafts, countDrafts };
