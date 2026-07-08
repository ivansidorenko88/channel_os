const prisma = require("../config/prisma");

async function createSubscriberEvent(data) {
  return prisma.subscriberEvent.create({ data });
}

async function createSnapshot(data) {
  return prisma.subscriberSnapshot.create({ data });
}

async function countEventsByOwner(ownerId, eventType, since = null) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);

  return prisma.subscriberEvent.count({
    where: {
      channelId: { in: channelIds },
      eventType,
      ...(since ? { createdAt: { gte: since } } : {})
    }
  });
}

async function listRecentEventsByOwner(ownerId, take = 10) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, select: { id: true } });
  const channelIds = channels.map((channel) => channel.id);

  return prisma.subscriberEvent.findMany({
    where: { channelId: { in: channelIds } },
    include: { channel: true },
    orderBy: { createdAt: "desc" },
    take
  });
}

async function latestSnapshot(channelId) {
  return prisma.subscriberSnapshot.findFirst({
    where: { channelId },
    orderBy: { createdAt: "desc" }
  });
}

module.exports = { createSubscriberEvent, createSnapshot, countEventsByOwner, listRecentEventsByOwner, latestSnapshot };
