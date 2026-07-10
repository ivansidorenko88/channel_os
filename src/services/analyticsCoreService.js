const { listAllChannels, listChannels, findChannel } = require("../repositories/channelRepository");
const analyticsRepository = require("../repositories/analyticsRepository");
const { getChatMemberCount } = require("./telegramChatService");

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function getDelta(current, previous) {
  if (!current || !previous) return 0;
  return current.subscriberCount - previous.subscriberCount;
}

function formatSigned(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function formatDateTime(date) {
  if (!date) return "нет данных";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildSparkline(values) {
  const clean = values.filter((value) => Number.isFinite(Number(value))).map(Number);

  if (!clean.length) return "нет данных";
  if (clean.length === 1) return "▃";

  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const min = Math.min(...clean);
  const max = Math.max(...clean);

  if (min === max) return clean.map(() => "▃").join("");

  return clean
    .map((value) => {
      const index = Math.round(((value - min) / (max - min)) * (blocks.length - 1));
      return blocks[index];
    })
    .join("");
}

function calculateBestInterval(snapshots) {
  if (!snapshots || snapshots.length < 2) return null;

  let best = null;

  for (let i = 1; i < snapshots.length; i += 1) {
    const previous = snapshots[i - 1];
    const current = snapshots[i];
    const delta = current.subscriberCount - previous.subscriberCount;

    if (!best || delta > best.delta) {
      best = {
        from: previous.createdAt,
        to: current.createdAt,
        delta
      };
    }
  }

  return best;
}

async function collectChannelSnapshot(telegram, channel, source = "scheduler") {
  const subscriberCount = await getChatMemberCount(telegram, channel.telegramId);
  const postCount = await analyticsRepository.countPostsForChannel(channel.id);
  const scheduledCount = await analyticsRepository.countScheduledForChannel(channel.id);
  const draftCount = await analyticsRepository.countDraftsForChannel(channel.id);

  return analyticsRepository.createAnalyticsSnapshot({
    channelId: channel.id,
    subscriberCount,
    postCount,
    scheduledCount,
    draftCount,
    source
  });
}

async function collectAllSnapshots(telegram) {
  const channels = await listAllChannels();
  const result = { total: channels.length, success: 0, failed: 0, errors: [] };

  for (const channel of channels) {
    try {
      await collectChannelSnapshot(telegram, channel, "scheduler");
      result.success += 1;
      console.log(`[AnalyticsCore] Snapshot saved for ${channel.title}`);
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        channelId: channel.id,
        title: channel.title,
        message: error.message
      });
      console.error(`[AnalyticsCore] Snapshot failed for ${channel.title}:`, error.message);
    }
  }

  return result;
}

async function collectOwnerSnapshots(telegram, ownerId) {
  const channels = await listChannels(ownerId);
  const result = { total: channels.length, success: 0, failed: 0, errors: [] };

  for (const channel of channels) {
    try {
      await collectChannelSnapshot(telegram, channel, "manual");
      result.success += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        channelId: channel.id,
        title: channel.title,
        message: error.message
      });
      console.error(`[AnalyticsCore] Manual snapshot failed for ${channel.title}:`, error.message);
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
  const daySnapshots = await analyticsRepository.listAnalyticsSnapshotsSince(channel.id, daysAgo(1));
  const recentSnapshots = await analyticsRepository.listRecentAnalyticsSnapshots(channel.id, 8);

  return {
    channel,
    latest,
    deltaDay: getDelta(latest, day),
    deltaWeek: getDelta(latest, week),
    deltaMonth: getDelta(latest, month),
    sparkline7d: buildSparkline(weekSnapshots.map((snapshot) => snapshot.subscriberCount)),
    sparkline24h: buildSparkline(daySnapshots.map((snapshot) => snapshot.subscriberCount)),
    daySnapshots,
    recentSnapshots,
    bestInterval24h: calculateBestInterval(daySnapshots)
  };
}

async function getChannelAnalyticsForOwner(ownerId, channelId) {
  const channel = await findChannel(ownerId, channelId);
  if (!channel) return null;
  return getChannelAnalytics(channel);
}

async function getOwnerAnalytics(ownerId) {
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
  collectOwnerSnapshots,
  collectChannelSnapshot,
  getOwnerAnalytics,
  getChannelAnalytics,
  getChannelAnalyticsForOwner,
  buildSparkline,
  formatSigned,
  formatDateTime
};
