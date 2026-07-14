const prisma = require("../config/prisma");

async function ownerChannelIds(ownerId) {
  const channels = await prisma.channel.findMany({
    where: { ownerId, isActive: true },
    select: { id: true }
  });

  return channels.map((channel) => channel.id);
}

async function createScheduledPost(data) {
  return prisma.scheduledPost.create({ data });
}

async function listPendingByOwner(ownerId, take = 20) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return [];

  return prisma.scheduledPost.findMany({
    where: {
      channelId: { in: channelIds },
      status: "pending"
    },
    include: { channel: true },
    orderBy: { scheduledAt: "asc" },
    take
  });
}

async function listFailedByOwner(ownerId, take = 30) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return [];

  return prisma.scheduledPost.findMany({
    where: {
      channelId: { in: channelIds },
      status: { in: ["failed", "uncertain"] }
    },
    include: { channel: true },
    orderBy: { updatedAt: "desc" },
    take
  });
}

async function listByOwnerRange(ownerId, from, to, take = 50) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return [];

  return prisma.scheduledPost.findMany({
    where: {
      channelId: { in: channelIds },
      status: "pending",
      scheduledAt: {
        gte: from,
        lt: to
      }
    },
    include: { channel: true },
    orderBy: { scheduledAt: "asc" },
    take
  });
}

async function findScheduledForOwner(ownerId, scheduledId) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return null;

  return prisma.scheduledPost.findFirst({
    where: {
      id: Number(scheduledId),
      channelId: { in: channelIds }
    },
    include: { channel: true }
  });
}

async function updateScheduledForOwner(ownerId, scheduledId, data) {
  const item = await findScheduledForOwner(ownerId, scheduledId);

  if (!item) return null;

  await prisma.scheduledPost.update({
    where: { id: item.id },
    data
  });

  return findScheduledForOwner(ownerId, scheduledId);
}

async function cancelScheduledForOwner(ownerId, scheduledId) {
  return updateScheduledForOwner(ownerId, scheduledId, {
    status: "cancelled",
    processingStartedAt: null
  });
}

async function queuePublishNow(ownerId, scheduledId) {
  const item = await findScheduledForOwner(ownerId, scheduledId);

  if (!item) return null;

  if (!["pending", "failed"].includes(item.status)) {
    return item;
  }

  return prisma.scheduledPost.update({
    where: { id: item.id },
    data: {
      status: "pending",
      scheduledAt: new Date(),
      reminderSentAt: null,
      failureReason: null,
      processingStartedAt: null
    },
    include: { channel: true }
  });
}

async function retryFailedForOwner(ownerId, scheduledId) {
  const item = await findScheduledForOwner(ownerId, scheduledId);

  if (!item || item.status !== "failed") return null;

  return queuePublishNow(ownerId, scheduledId);
}

async function findDuePostIds() {
  return prisma.scheduledPost.findMany({
    where: {
      status: "pending",
      channel: { isActive: true },
      scheduledAt: { lte: new Date() }
    },
    select: { id: true },
    orderBy: { scheduledAt: "asc" },
    take: 10
  });
}

async function claimScheduledPost(id) {
  const now = new Date();

  const claimed = await prisma.scheduledPost.updateMany({
    where: {
      id: Number(id),
      status: "pending"
    },
    data: {
      status: "processing",
      processingStartedAt: now,
      lastAttemptAt: now,
      attemptCount: { increment: 1 }
    }
  });

  if (!claimed.count) return null;

  return prisma.scheduledPost.findUnique({
    where: { id: Number(id) },
    include: {
      channel: {
        include: { owner: true }
      }
    }
  });
}

async function recoverStuckProcessing(minutes = 10) {
  const cutoff = new Date(
    Date.now() - Number(minutes) * 60 * 1000
  );

  return prisma.scheduledPost.updateMany({
    where: {
      status: "processing",
      processingStartedAt: { lt: cutoff }
    },
    data: {
      status: "uncertain",
      processingStartedAt: null,
      failureReason:
        "Процесс публикации был прерван. Проверь канал вручную перед повторной отправкой."
    }
  });
}

async function findUpcomingReminderCandidates(maxMinutes = 60) {
  const now = new Date();
  const until = new Date(
    now.getTime() + maxMinutes * 60 * 1000
  );

  return prisma.scheduledPost.findMany({
    where: {
      status: "pending",
      channel: { isActive: true },
      reminderSentAt: null,
      reminderMinutes: { gt: 0 },
      scheduledAt: {
        gt: now,
        lte: until
      }
    },
    include: {
      channel: {
        include: { owner: true }
      }
    },
    orderBy: { scheduledAt: "asc" },
    take: 50
  });
}

async function markReminderSent(id) {
  return prisma.scheduledPost.update({
    where: { id: Number(id) },
    data: { reminderSentAt: new Date() }
  });
}

async function markFailed(id, failureReason = null) {
  return prisma.scheduledPost.update({
    where: { id: Number(id) },
    data: {
      status: "failed",
      processingStartedAt: null,
      failureReason: failureReason
        ? String(failureReason).slice(0, 1000)
        : null
    }
  });
}


async function markUncertain(id, failureReason = null) {
  return prisma.scheduledPost.update({
    where: { id: Number(id) },
    data: {
      status: "uncertain",
      processingStartedAt: null,
      failureReason: failureReason
        ? String(failureReason).slice(0, 1000)
        : "Telegram принял сообщение, но результат не подтверждён в базе"
    }
  });
}

async function completeScheduledPublication({
  item,
  telegramMessageId,
  nextScheduledAt
}) {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        channelId: item.channel.id,
        telegramMessageId,
        type: item.type,
        text: item.text,
        fileId: item.fileId,
        caption: item.caption,
        category: item.category,
        status: "published",
        publishedAt: new Date()
      }
    });

    await tx.scheduledPost.update({
      where: { id: item.id },
      data: {
        status: "published",
        publishedAt: new Date(),
        processingStartedAt: null,
        failureReason: null
      }
    });

    let next = null;

    if (nextScheduledAt) {
      next = await tx.scheduledPost.create({
        data: {
          channelId: item.channel.id,
          type: item.type,
          text: item.text,
          fileId: item.fileId,
          caption: item.caption,
          category: item.category,
          status: "pending",
          scheduledAt: nextScheduledAt,
          recurrence: item.recurrence,
          recurrenceUntil: item.recurrenceUntil,
          reminderMinutes: item.reminderMinutes
        }
      });
    }

    return { post, next };
  });
}

async function countPendingByOwner(ownerId) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return 0;

  return prisma.scheduledPost.count({
    where: {
      channelId: { in: channelIds },
      status: "pending"
    }
  });
}

async function countFailedByOwner(ownerId) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return 0;

  return prisma.scheduledPost.count({
    where: {
      channelId: { in: channelIds },
      status: { in: ["failed", "uncertain"] }
    }
  });
}

async function countRecurringByOwner(ownerId) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return 0;

  return prisma.scheduledPost.count({
    where: {
      channelId: { in: channelIds },
      status: "pending",
      recurrence: { not: "none" }
    }
  });
}

async function countByOwnerRange(ownerId, from, to) {
  const channelIds = await ownerChannelIds(ownerId);

  if (!channelIds.length) return 0;

  return prisma.scheduledPost.count({
    where: {
      channelId: { in: channelIds },
      status: "pending",
      scheduledAt: {
        gte: from,
        lt: to
      }
    }
  });
}

module.exports = {
  createScheduledPost,
  listPendingByOwner,
  listFailedByOwner,
  listByOwnerRange,
  findScheduledForOwner,
  updateScheduledForOwner,
  cancelScheduledForOwner,
  queuePublishNow,
  retryFailedForOwner,
  findDuePostIds,
  claimScheduledPost,
  recoverStuckProcessing,
  findUpcomingReminderCandidates,
  markReminderSent,
  markFailed,
  markUncertain,
  completeScheduledPublication,
  countPendingByOwner,
  countFailedByOwner,
  countRecurringByOwner,
  countByOwnerRange
};
