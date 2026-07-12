const {
  findDuePosts,
  markFailed,
  completeScheduledPublication
} = require("../repositories/scheduledPostRepository");
const {
  getNextOccurrence,
  isNextOccurrenceAllowed
} = require("../services/scheduleService");
const {
  sendContent
} = require("../services/telegramPublishService");
const {
  formatDateTime
} = require("../utils/contentPlanFormatter");

async function notifyFailure(bot, item, error) {
  const ownerTelegramId = item.channel?.owner?.telegramId;

  if (!ownerTelegramId) return;
  if (item.channel?.owner?.notificationsEnabled === false) return;

  try {
    await bot.telegram.sendMessage(
      ownerTelegramId,
      [
        "❌ Не удалось опубликовать пост",
        "",
        `📢 Канал: ${item.channel.title}`,
        `🕒 Время: ${formatDateTime(item.scheduledAt)}`,
        "",
        "Проверь права бота в канале.",
        "",
        `Ошибка: ${String(error.message || error).slice(0, 500)}`
      ].join("\n")
    );
  } catch (notifyError) {
    console.error(
      `Failed to notify owner about scheduled post ${item.id}:`,
      notifyError.message
    );
  }
}

async function processDuePosts(bot) {
  const duePosts = await findDuePosts();

  for (const item of duePosts) {
    try {
      const sent = await sendContent(
        bot.telegram,
        item.channel.telegramId,
        item
      );

      const candidate = getNextOccurrence(
        item.scheduledAt,
        item.recurrence
      );

      const nextScheduledAt = isNextOccurrenceAllowed(
        item,
        candidate
      )
        ? candidate
        : null;

      await completeScheduledPublication({
        item,
        telegramMessageId: sent.message_id,
        nextScheduledAt
      });

      console.log(
        `Scheduled post ${item.id} published` +
          (nextScheduledAt
            ? `; next occurrence: ${nextScheduledAt.toISOString()}`
            : "")
      );
    } catch (error) {
      console.error(
        `Scheduled post ${item.id} failed:`,
        error
      );

      await markFailed(item.id, error.message);
      await notifyFailure(bot, item, error);
    }
  }
}

function startPublisherScheduler(bot) {
  let running = false;

  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      await processDuePosts(bot);
    } catch (error) {
      console.error(
        "Publisher scheduler loop error:",
        error
      );
    } finally {
      running = false;
    }
  }, 30000);

  console.log("[ContentPlan] Publisher scheduler started.");
}

module.exports = {
  startPublisherScheduler,
  processDuePosts
};
