const {
  upsertUser,
  updateUserSettings,
  resetUserSettings
} = require("../repositories/userRepository");

const ALLOWED_REMINDERS = [0, 15, 30, 60];

async function getSettings(from) {
  return upsertUser(from);
}

async function setDefaultReminder(from, minutes) {
  const user = await upsertUser(from);
  const value = Number(minutes);

  if (!ALLOWED_REMINDERS.includes(value)) return null;

  return updateUserSettings(user.id, {
    defaultReminderMinutes: value
  });
}

async function toggleNotifications(from) {
  const user = await upsertUser(from);

  return updateUserSettings(user.id, {
    notificationsEnabled: !user.notificationsEnabled
  });
}

async function toggleSuccessNotifications(from) {
  const user = await upsertUser(from);

  return updateUserSettings(user.id, {
    notifyOnSuccess: !user.notifyOnSuccess
  });
}

async function toggleFailureNotifications(from) {
  const user = await upsertUser(from);

  return updateUserSettings(user.id, {
    notifyOnFailure: !user.notifyOnFailure
  });
}

async function togglePublishConfirmation(from) {
  const user = await upsertUser(from);

  return updateUserSettings(user.id, {
    confirmBeforePublish: !user.confirmBeforePublish
  });
}

async function setDefaultCategory(from, category) {
  const user = await upsertUser(from);
  const value = String(category || "").trim().slice(0, 60);

  return updateUserSettings(user.id, {
    defaultCategory: value || null
  });
}

async function clearDefaultCategory(from) {
  const user = await upsertUser(from);

  return updateUserSettings(user.id, {
    defaultCategory: null
  });
}

async function resetSettings(from) {
  const user = await upsertUser(from);
  return resetUserSettings(user.id);
}

module.exports = {
  ALLOWED_REMINDERS,
  getSettings,
  setDefaultReminder,
  toggleNotifications,
  toggleSuccessNotifications,
  toggleFailureNotifications,
  togglePublishConfirmation,
  setDefaultCategory,
  clearDefaultCategory,
  resetSettings
};
