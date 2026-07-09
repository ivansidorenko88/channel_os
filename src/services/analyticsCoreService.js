const { listAllChannels } = require("../repositories/channelRepository");
const analyticsRepository = require("../repositories/analyticsRepository");

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getDelta(current, previous) {
  if (!current || !previous) return 0;
  return current.subscriberCount - previous.subscriberCount;
}

function buildSparkline(values) {
  if (!values.length) return "нет данных";
  if (values.length === 1) return "▁";

  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) return values.map(() => "▃").join("");

  return values
    .map((value) => {
      const index = Math.round(((value - min) / (max - min)) * (blocks.length - 1));
      return blocks[index];
    })
    .join("");
}

async function collectChannelSnapshot(telegram, channel) {
  const subscriberCount = await telegram.getChatMemberCount(channel.telegramId);
  const postCount = await analyticsRepository.countPostsForChannel(channel.id);
  const scheduledCount = await analyticsRepository.countScheduledForChannel(channel.id);
  const draftCount = await analyticsRepository.countDraftsForChannel(channel.id);

  const snapshot = await analyticsRepository.createAnalyticsSnapshot({
    channelId: channel.id,
    subscriberCount,
    postCount,
    scheduledCount,
    draftCount,
    source: "scheduler"
  });

  return snapshot;
}

async function collectAllSnapshots(telegram) {
  const channels = await listAllChannels();
  const result = {
    total: channels.length,
    success: 0,
    failed: 0
  };

  for (const channel of channels) {
    try {
      await collectChannelSnapshot(telegram, channel);
      result.success += 1;
      console.log(`[AnalyticsCore] Snapshot saved for ${channel.title}`);
    } catch (error) {
      result.failed += 1;
      console.error(`[AnalyticsCore] Snapshot failed for ${channel.title}:`, error.message);
    }
  }

  return result;
}

async function getChannelAnalytics(channel) {
  const latest = await analyticsRepository.latestAnalyticsSnapshot(channel.id);
  const day = await analyticsRepository.firstAnalyticsSnapshotSince(channel.id, daysAgo(1));
  const week = await analyticsRepository.firstAnalyticsSnapshotSince(channel.id, daysAgo(7));
  const month = await analyticsRepository.firstAnalyticsSnapshotSince(channel.id, daysAgo(30));
  const weekSnapshots = await analyticsRepository.listAnalyticsSnapshotsSince(channel.id, daysAgo(7));

  return {
    channel,
    latest,
    deltaDay: getDelta(latest, day),
    deltaWeek: getDelta(latest, week),
    deltaMonth: getDelta(latest, month),
    sparkline7d: buildSparkline(weekSnapshots.map((snapshot) => snapshot.subscriberCount))
  };
}

async function getOwnerAnalytics(ownerId) {
  const { listChannels } = require("../repositories/channelRepository");
  const channels = await listChannels(ownerId);
  const rows = [];

  for (const channel of channels) {
    rows.push(await getChannelAnalytics(channel));
  }

  const totalSubscribers = rows.reduce((sum, row) => sum + (row.latest ? row.latest.subscriberCount : 0), 0);
  const totalDeltaDay = rows.reduce((sum, row) => sum + row.deltaDay, 0);
  const totalDeltaWeek = rows.reduce((sum, row) => sum + row.deltaWeek, 0);
  const totalDeltaMonth = rows.reduce((sum, row) => sum + row.deltaMonth, 0);

  return {
    channelCount: channels.length,
    totalSubscribers,
    totalDeltaDay,
    totalDeltaWeek,
    totalDeltaMonth,
    rows
  };
}

module.exports = {
  collectAllSnapshots,
  collectChannelSnapshot,
  getOwnerAnalytics,
  getChannelAnalytics,
  buildSparkline
};
