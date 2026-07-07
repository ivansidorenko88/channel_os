const prisma = require("../config/prisma");
async function createPublishedPost({ channelId, text, telegramMessageId }) {
  return prisma.post.create({ data: { channelId, text, telegramMessageId, status: "published", publishedAt: new Date() } });
}
async function getPostStats(ownerId) {
  const channels = await prisma.channel.findMany({ where: { ownerId }, include: { posts: true } });
  return { channelCount: channels.length, totalPosts: channels.reduce((sum, ch) => sum + ch.posts.length, 0) };
}
module.exports = { createPublishedPost, getPostStats };
