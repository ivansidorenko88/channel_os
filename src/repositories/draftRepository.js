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
      userId,
      status: "draft"
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
      userId,
      status: "draft"
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
      userId,
      status: "draft"
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
      userId,
      status: "draft"
    },
    include: {
      channel: true
    }
  });
}

async function duplicateDraft({ userId, draftId }) {
  const draft = await findDraft({ userId, draftId });

  if (!draft) return null;

  return prisma.draft.create({
    data: {
      userId,
      channelId:
        draft.channel && draft.channel.isActive
          ? draft.channel.id
          : null,
      type: draft.type,
      text: draft.text,
      fileId: draft.fileId,
      caption: draft.caption,
      category: draft.category
    },
    include: {
      channel: true
    }
  });
}


async function claimDraftForPublish({ userId, draftId }) {
  const now = new Date();

  const claimed = await prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId,
      status: "draft"
    },
    data: {
      status: "publishing",
      publishingStartedAt: now
    }
  });

  if (!claimed.count) return null;

  return prisma.draft.findFirst({
    where: {
      id: Number(draftId),
      userId,
      status: "publishing"
    },
    include: {
      channel: true
    }
  });
}

async function releaseDraftPublish({ userId, draftId }) {
  return prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId,
      status: "publishing"
    },
    data: {
      status: "draft",
      publishingStartedAt: null
    }
  });
}


async function markDraftPublicationUncertain({
  userId,
  draftId
}) {
  return prisma.draft.updateMany({
    where: {
      id: Number(draftId),
      userId,
      status: "publishing"
    },
    data: {
      status: "uncertain"
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

function buildSearchWhere(userId, query = "") {
  const clean = String(query || "").trim();

  if (!clean) return { userId, status: "draft" };

  return {
    userId,
    status: "draft",
    OR: [
      {
        text: {
          contains: clean,
          mode: "insensitive"
        }
      },
      {
        caption: {
          contains: clean,
          mode: "insensitive"
        }
      },
      {
        category: {
          contains: clean,
          mode: "insensitive"
        }
      }
    ]
  };
}

async function listDraftsPage(
  userId,
  {
    page = 0,
    pageSize = 6,
    query = ""
  } = {}
) {
  const safePage = Math.max(0, Number(page) || 0);
  const safePageSize = Math.min(
    10,
    Math.max(1, Number(pageSize) || 6)
  );
  const where = buildSearchWhere(userId, query);

  const total = await prisma.draft.count({ where });
  const pages = Math.max(1, Math.ceil(total / safePageSize));
  const normalizedPage = Math.min(safePage, pages - 1);

  const items = await prisma.draft.findMany({
    where,
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
    skip: normalizedPage * safePageSize,
    take: safePageSize
  });

  return {
    items,
    total,
    page: normalizedPage,
    pages,
    pageSize: safePageSize,
    query: String(query || "").trim()
  };
}

async function listDrafts(userId, take = 20) {
  return prisma.draft.findMany({
    where: { userId, status: "draft" },
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
    take
  });
}

async function countDrafts(userId) {
  return prisma.draft.count({
    where: { userId, status: "draft" }
  });
}

module.exports = {
  createDraft,
  setDraftChannel,
  updateDraftContent,
  updateDraftCategory,
  findDraft,
  duplicateDraft,
  claimDraftForPublish,
  releaseDraftPublish,
  markDraftPublicationUncertain,
  deleteDraft,
  listDraftsPage,
  listDrafts,
  countDrafts
};
