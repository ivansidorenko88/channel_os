const prisma = require("../config/prisma");

async function upsertUser(from) {
  return prisma.user.upsert({
    where: {
      telegramId: String(from.id)
    },
    update: {
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null
    },
    create: {
      telegramId: String(from.id),
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null
    }
  });
}

module.exports = {
  upsertUser
};
