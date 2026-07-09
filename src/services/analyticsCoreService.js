const { listAllChannels, listChannels, findChannel } = require("../repositories/channelRepository");
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

function formatSigned(value) {
  return value >= 0 ? `+${value}` : String(value);
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

function calculateBestInterval(snapshots) {
  if (snapshots.length < 2) return null;

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

  let score = 50;

  if (row.latest) score += 10;
  if (row.deltaDay > 0) score += 15;
  if (row.deltaWeek > 0) score += 15;
  if (row.latest && row.latest.postCount > 0) score += 10;
  if (row.latest && row.latest.scheduledCount > 0) score += 5;
  if (row.deltaDay < 0) score -= 10;
  if (row.deltaWeek < 0) score -= 10;

  return Math.max(0, Math.min(100, score));
}

  if (score >= 85) return "🟢 Отличное состояние";
  if (score >= 65) return "🟡 Нормальное состояние";
  return "🔴 Требует внимания";
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
  const result = { total: channels.length, success: 0, failed: 0 };

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
  const daySnapshots = await analyticsRepository.listAnalyticsSnapshotsSince(channel.id, daysAgo(1));
  const recentSnapshots = await analyticsRepository.listRecentAnalyticsSnapshots(channel.id, 8);

  const row = {
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

  return row;
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
  collectChannelSnapshot,
  getOwnerAnalytics,
  getChannelAnalytics,
  getChannelAnalyticsForOwner,
  buildSparkline,
  formatSigned,
  formatDateTime
};
