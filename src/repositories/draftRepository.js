const prisma = require("../config/prisma");

async function createDraft({ userId, text }) {
  return prisma.draft.create({
    data: {
      userId,
      text
    }
  });
}

async function setDraftChannel({ userId, draftId, channelId }) {
  return prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId
    },
    data: {
      channelId: Number(channelId)
    }
  });
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

async function countDrafts(userId) {
  return prisma.draft.count({
    where: { userId }
  });
}

module.exports = {
  createDraft,
  setDraftChannel,
  findDraft,
  deleteDraft,
  countDrafts
};
