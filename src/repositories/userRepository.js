const prisma = require("../config/prisma");

async function upsertUser(from) {
  return prisma.user.upsert({
    where: { telegramId: String(from.id) },
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

async function updateUserSettings(userId, data) {
  return prisma.user.update({
    where: { id: Number(userId) },
    data
  });
}

async function markOnboardingCompleted(userId, completed = true) {
  return prisma.user.update({
    where: { id: Number(userId) },
    data: { onboardingCompleted: Boolean(completed) }
  });
}

async function resetUserSettings(userId) {
  return prisma.user.update({
    where: { id: Number(userId) },
    data: {
      defaultReminderMinutes: 30,
      notificationsEnabled: true,
      confirmBeforePublish: true,
      defaultCategory: null,
      notifyOnSuccess: false,
      notifyOnFailure: true
    }
  });
}

module.exports = {
  upsertUser,
  updateUserSettings,
  markOnboardingCompleted,
  resetUserSettings
};
