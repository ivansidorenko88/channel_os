const {
  findUpcomingReminderCandidates,
  markReminderSent
} = require("../repositories/scheduledPostRepository");
const {
  formatDateTime,
  recurrenceLabel
} = require("../utils/contentPlanFormatter");

function shouldSendReminder(item, now = new Date()) {
  const reminderMinutes = Number(item.reminderMinutes || 0);

  if (!reminderMinutes) return false;

  const sendAt =
    new Date(item.scheduledAt).getTime() -
    reminderMinutes * 60 * 1000;

  return now.getTime() >= sendAt;
}

async function sendReminder(bot, item) {
  const ownerTelegramId = item.channel?.owner?.telegramId;

  if (!ownerTelegramId) return false;
  if (item.channel?.owner?.notificationsEnabled === false) {
    await markReminderSent(item.id);
    return false;
  }

  await bot.telegram.sendMessage(
    ownerTelegramId,
    [
      "🔔 Скоро выйдет публикация",
      "",
      `📢 Канал: ${item.channel.title}`,
      `🕒 Время: ${formatDateTime(item.scheduledAt)}`,
      `🏷 Рубрика: ${item.category || "не указана"}`,
      `🔁 Повтор: ${recurrenceLabel(item.recurrence)}`,
      "",
      "Открой /plan, чтобы перенести или изменить пост."
    ].join("\n")
  );

  await markReminderSent(item.id);
  return true;
}

async function processReminders(bot) {
  const items = await findUpcomingReminderCandidates(60);
  const now = new Date();

  for (const item of items) {
    if (!shouldSendReminder(item, now)) continue;

    try {
      await sendReminder(bot, item);
    } catch (error) {
      console.error(
        `Reminder for scheduled post ${item.id} failed:`,
        error.message
      );
    }
  }
}

function startContentReminderScheduler(bot) {
  let running = false;

  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      await processReminders(bot);
    } catch (error) {
      console.error(
        "Content reminder scheduler error:",
        error
      );
    } finally {
      running = false;
    }
  }, 60000);

  console.log("[ContentPlan] Reminder scheduler started.");
}

module.exports = {
  startContentReminderScheduler,
  processReminders,
  shouldSendReminder
};
