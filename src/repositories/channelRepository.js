const prisma = require("../config/prisma");
async function upsertChannelForUser({ ownerId, telegramId, title, username }) {
  return prisma.channel.upsert({
    where: { ownerId_telegramId: { ownerId, telegramId: String(telegramId) } },
    update: { title, username: username || null },
    create: { ownerId, telegramId: String(telegramId), title, username: username || null },
  });
}
async function listUserChannels(ownerId) {
  return prisma.channel.findMany({ where: { ownerId }, orderBy: { createdAt: "desc" } });
}
module.exports = { upsertChannelForUser, listUserChannels };
