const { listAllChannels, listChannels, findChannel } = require("../repositories/channelRepository");
const analyticsRepository = require("../repositories/analyticsRepository");
const { getChatMemberCount } = require("./telegramChatService");

const SNAPSHOT_INTERVAL_MINUTES = Number(
  process.env.ANALYTICS_INTERVAL_MINUTES || 30
);

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function getDelta(current, previous) {
  if (!current || !previous) return null;
  return current.subscriberCount - previous.subscriberCount;
}

function formatSigned(value) {
  if (value === null || value === undefined) {
    return "собираем данные";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return "собираем данные";
  }

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

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    return "нет данных";
  }

  const totalMinutes = Math.floor(milliseconds / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days} д. ${hours} ч.` : `${days} д.`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours} ч. ${minutes} мин.` : `${hours} ч.`;
  }

  return `${Math.max(minutes, 0)} мин.`;
}

function downsample(values, maxPoints = 6) {
  if (values.length <= maxPoints) return values;

  const result = [];
  const lastIndex = values.length - 1;

  for (let index = 0; index < maxPoints; index += 1) {
    const sourceIndex = Math.round((index / (maxPoints - 1)) * lastIndex);
    result.push(values[sourceIndex]);
  }

  return result;
}

function buildTrendLine(snapshots, maxPoints = 6) {
  if (!snapshots || !snapshots.length) return "нет данных";

  const values = downsample(
    snapshots.map((snapshot) => Number(snapshot.subscriberCount)),
    maxPoints
  );

  return values
    .map((value) => value.toLocaleString("ru-RU"))
    .join(" → ");
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

function chooseClosestSnapshot(before, after, target) {
  if (!before) return after || null;
  if (!after) return before;

  const targetTime = new Date(target).getTime();
  const beforeDistance = Math.abs(
    targetTime - new Date(before.createdAt).getTime()
  );
  const afterDistance = Math.abs(
    new Date(after.createdAt).getTime() - targetTime
  );

  return beforeDistance <= afterDistance ? before : after;
}

async function getPeriodBaseline(channelId, earliest, days) {
  const target = daysAgo(days);

  if (!earliest || new Date(earliest.createdAt) > target) {
    return null;
  }

  const [before, after] = await Promise.all([
    analyticsRepository.closestAnalyticsSnapshotAtOrBefore(channelId, target),
    analyticsRepository.closestAnalyticsSnapshotAtOrAfter(channelId, target)
  ]);

  return chooseClosestSnapshot(before, after, target);
}

function getHistoryState(earliest, latest) {
  if (!earliest || !latest) {
    return {
      availableMs: 0,
      availableText: "нет данных",
      remaining24hMs: 24 * 60 * 60 * 1000,
      remaining24hText: "24 ч.",
      has24h: false,
      has7d: false,
      has30d: false
    };
  }

  const availableMs = Math.max(
    0,
    new Date(latest.createdAt).getTime() -
      new Date(earliest.createdAt).getTime()
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const remaining24hMs = Math.max(0, dayMs - availableMs);

  return {
    availableMs,
    availableText: formatDuration(availableMs),
    remaining24hMs,
    remaining24hText: formatDuration(remaining24hMs),
    has24h: availableMs >= dayMs,
    has7d: availableMs >= 7 * dayMs,
    has30d: availableMs >= 30 * dayMs
  };
}

async function collectChannelSnapshot(telegram, channel, source = "scheduler") {
  const subscriberCount = await getChatMemberCount(
    telegram,
    channel.telegramId
  );

  const postCount = await analyticsRepository.countPostsForChannel(channel.id);
  const scheduledCount =
    await analyticsRepository.countScheduledForChannel(channel.id);
  const draftCount =
    await analyticsRepository.countDraftsForChannel(channel.id);

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
  const result = {
    total: channels.length,
    success: 0,
    failed: 0,
    errors: []
  };

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
      console.error(
        `[AnalyticsCore] Snapshot failed for ${channel.title}:`,
        error.message
      );
    }
  }

  return result;
}

async function collectOwnerSnapshots(telegram, ownerId) {
  const channels = await listChannels(ownerId);
  const result = {
    total: channels.length,
    success: 0,
    failed: 0,
    errors: []
  };

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
      console.error(
        `[AnalyticsCore] Manual snapshot failed for ${channel.title}:`,
        error.message
      );
    }
  }

  return result;
}

async function getChannelAnalytics(channel) {
  const [latest, earliest] = await Promise.all([
    analyticsRepository.latestAnalyticsSnapshot(channel.id),
    analyticsRepository.earliestAnalyticsSnapshot(channel.id)
  ]);

  const [day, week, month] = latest
    ? await Promise.all([
        getPeriodBaseline(channel.id, earliest, 1),
        getPeriodBaseline(channel.id, earliest, 7),
        getPeriodBaseline(channel.id, earliest, 30)
      ])
    : [null, null, null];

  const [weekSnapshots, daySnapshots, recentSnapshots] = await Promise.all([
    analyticsRepository.listAnalyticsSnapshotsSince(channel.id, daysAgo(7)),
    analyticsRepository.listAnalyticsSnapshotsSince(channel.id, daysAgo(1)),
    analyticsRepository.listRecentAnalyticsSnapshots(channel.id, 8)
  ]);

  const history = getHistoryState(earliest, latest);

  return {
    channel,
    latest,
    earliest,
    history,
    deltaDay: getDelta(latest, day),
    deltaWeek: getDelta(latest, week),
    deltaMonth: getDelta(latest, month),
    trend7d: buildTrendLine(weekSnapshots),
    trend24h: buildTrendLine(daySnapshots),
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

function aggregateDelta(rows, field) {
  if (!rows.length) return null;

  const rowsWithSnapshot = rows.filter((row) => row.latest);
  if (!rowsWithSnapshot.length) return null;

  if (
    rowsWithSnapshot.some(
      (row) => row[field] === null || row[field] === undefined
    )
  ) {
    return null;
  }

  return rowsWithSnapshot.reduce((sum, row) => sum + row[field], 0);
}

async function getOwnerAnalytics(ownerId) {
  const channels = await listChannels(ownerId);
  const rows = await Promise.all(
    channels.map((channel) => getChannelAnalytics(channel))
  );

  const totalSubscribers = rows.reduce(
    (sum, row) => sum + (row.latest ? row.latest.subscriberCount : 0),
    0
  );

  const latestSnapshotAt = rows.reduce((latest, row) => {
    const date = row.latest?.createdAt;
    if (!date) return latest;
    if (!latest || new Date(date) > new Date(latest)) return date;
    return latest;
  }, null);

  const earliestSnapshotAt = rows.reduce((earliest, row) => {
    const date = row.earliest?.createdAt;
    if (!date) return earliest;
    if (!earliest || new Date(date) < new Date(earliest)) return date;
    return earliest;
  }, null);

  const historyAvailableMs =
    earliestSnapshotAt && latestSnapshotAt
      ? Math.max(
          0,
          new Date(latestSnapshotAt).getTime() -
            new Date(earliestSnapshotAt).getTime()
        )
      : 0;

  return {
    channelCount: channels.length,
    totalSubscribers,
    totalDeltaDay: aggregateDelta(rows, "deltaDay"),
    totalDeltaWeek: aggregateDelta(rows, "deltaWeek"),
    totalDeltaMonth: aggregateDelta(rows, "deltaMonth"),
    latestSnapshotAt,
    earliestSnapshotAt,
    historyAvailableMs,
    historyAvailableText: formatDuration(historyAvailableMs),
    snapshotIntervalMinutes: SNAPSHOT_INTERVAL_MINUTES,
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
  buildTrendLine,
  formatSigned,
  formatDateTime,
  formatDuration
};
