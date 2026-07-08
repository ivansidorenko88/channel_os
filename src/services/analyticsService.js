const { upsertUser } = require("../repositories/userRepository");
const { listChannels } = require("../repositories/channelRepository");
const { countPostsByOwnerSince, countPostsByChannel, lastPostByChannel } = require("../repositories/postRepository");
const { countPendingByOwner } = require("../repositories/scheduledPostRepository");
const { countDrafts } = require("../repositories/draftRepository");
const { countEventsByOwner, listRecentEventsByOwner, latestSnapshot } = require("../repositories/subscriberRepository");

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function formatDate(date) {
  if (!date) return "нет";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function overview(from) {
  const user = await upsertUser(from);
  const channels = await listChannels(user.id);

  const posts7 = await countPostsByOwnerSince(user.id, daysAgo(7));
  const posts30 = await countPostsByOwnerSince(user.id, daysAgo(30));
  const drafts = await countDrafts(user.id);
  const scheduled = await countPendingByOwner(user.id);
  const subscribed7 = await countEventsByOwner(user.id, "subscribed", daysAgo(7));
  const unsubscribed7 = await countEventsByOwner(user.id, "unsubscribed", daysAgo(7));

  return {
    channelCount: channels.length,
    posts7,
    posts30,
    drafts,
    scheduled,
    subscribed7,
    unsubscribed7,
    net7: subscribed7 - unsubscribed7
  };
}

async function period(from, days) {
  const user = await upsertUser(from);
  const since = daysAgo(days);

  return {
    days,
    posts: await countPostsByOwnerSince(user.id, since),
    subscribed: await countEventsByOwner(user.id, "subscribed", since),
    unsubscribed: await countEventsByOwner(user.id, "unsubscribed", since)
  };
}

async function channelsReport(from) {
  const user = await upsertUser(from);
  const channels = await listChannels(user.id);

  const rows = [];
  for (const channel of channels) {
    const postsTotal = await countPostsByChannel(channel.id);
    const posts7 = await countPostsByChannel(channel.id, daysAgo(7));
    const lastPost = await lastPostByChannel(channel.id);
    const snapshot = await latestSnapshot(channel.id);

    rows.push({
      title: channel.title,
      postsTotal,
      posts7,
      lastPostAt: lastPost ? lastPost.publishedAt : null,
      subscriberCount: snapshot ? snapshot.subscriberCount : null
    });
  }

  rows.sort((a, b) => b.postsTotal - a.postsTotal);
  return rows;
}

async function subscribersReport(from) {
  const user = await upsertUser(from);
  const recent = await listRecentEventsByOwner(user.id, 10);
  const subscribed30 = await countEventsByOwner(user.id, "subscribed", daysAgo(30));
  const unsubscribed30 = await countEventsByOwner(user.id, "unsubscribed", daysAgo(30));

  return {
    subscribed30,
    unsubscribed30,
    net30: subscribed30 - unsubscribed30,
    recent
  };
}

module.exports = { overview, period, channelsReport, subscribersReport, formatDate };
