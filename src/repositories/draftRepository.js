const prisma = require("../config/prisma");

async function createDraft(data) {
  return prisma.draft.create({ data });
}

async function setDraftChannel({
  userId,
  draftId,
  channelId
}) {
  const channel = await prisma.channel.findFirst({
    where: {
      id: Number(channelId),
      ownerId: Number(userId),
      isActive: true
    }
  });

  if (!channel) return null;

  await prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId
    },
    data: {
      channelId: channel.id
    }
  });

  return findDraft({ userId, draftId });
}

async function updateDraftContent({
  userId,
  draftId,
  content
}) {
  await prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId
    },
    data: {
      type: content.type,
      text: content.text || null,
      fileId: content.fileId || null,
      caption: content.caption || null
    }
  });

  return findDraft({ userId, draftId });
}

async function updateDraftCategory({
  userId,
  draftId,
  category
}) {
  await prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId
    },
    data: {
      category: category || null
    }
  });

  return findDraft({ userId, draftId });
}

async function findDraft({ userId, draftId }) {
  return prisma.draft.findFirst({
    where: {
      id: Number(draftId),
      userId
    },
    include: {
      channel: true
    }
  });
}

async function deleteDraft({ userId, draftId }) {
  return prisma.draft.deleteMany({
    where: {
      id: Number(draftId),
      userId
    }
  });
}

async function listDrafts(userId, take = 20) {
  return prisma.draft.findMany({
    where: { userId },
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
    take
  });
}

async function countDrafts(userId) {
  return prisma.draft.count({
    where: { userId }
  });
}

module.exports = {
  createDraft,
  setDraftChannel,
  updateDraftContent,
  updateDraftCategory,
  findDraft,
  deleteDraft,
  listDrafts,
  countDrafts
};
