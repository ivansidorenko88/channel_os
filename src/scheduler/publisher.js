const {
  findDuePostIds,
  claimScheduledPost,
  recoverStuckProcessing,
  markFailed,
  markUncertain,
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

async function notifyFailure(
  telegram,
  item,
  error,
  uncertain = false
) {
  const owner = item.channel?.owner;
  const ownerTelegramId = owner?.telegramId;

  if (!ownerTelegramId) return;
  if (owner.notificationsEnabled === false) return;
  if (owner.notifyOnFailure === false) return;

  try {
    await telegram.sendMessage(
      ownerTelegramId,
      [
        uncertain
          ? "⚠️ Результат публикации не подтверждён"
          : "❌ Не удалось опубликовать пост",
        "",
        `📢 Канал: ${item.channel.title}`,
        `🕒 Время: ${formatDateTime(item.scheduledAt)}`,
        `🔁 Попытка: ${item.attemptCount}`,
        "",
        uncertain
          ? "Telegram принял сообщение, но база не подтвердила результат. Проверь канал вручную и не запускай повторную отправку без проверки."
          : "Открой /plan → Ошибки, чтобы повторить отправку.",
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

async function notifySuccess(telegram, item) {
  const owner = item.channel?.owner;
  const ownerTelegramId = owner?.telegramId;

  if (!ownerTelegramId) return;
  if (owner.notificationsEnabled === false) return;
  if (owner.notifyOnSuccess !== true) return;

  try {
    await telegram.sendMessage(
      ownerTelegramId,
      [
        "✅ Публикация успешно отправлена",
        "",
        `📢 Канал: ${item.channel.title}`,
        `🕒 ${formatDateTime(new Date())}`
      ].join("\n")
    );
  } catch (error) {
    console.error(
      `Success notification for scheduled post ${item.id} failed:`,
      error.message
    );
  }
}

async function processScheduledPostNow(
  telegram,
  scheduledId
) {
  const item = await claimScheduledPost(scheduledId);

  if (!item) {
    return {
      ok: false,
      reason:
        "Публикация уже обрабатывается, отменена или опубликована."
    };
  }

  let sent;

  try {
    sent = await sendContent(
      telegram,
      item.channel.telegramId,
      item
    );
  } catch (error) {
    console.error(
      `Scheduled post ${item.id} send failed:`,
      error
    );

    await markFailed(item.id, error.message);
    await notifyFailure(telegram, item, error, false);

    return {
      ok: false,
      item,
      error
    };
  }

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

  try {
    await completeScheduledPublication({
      item,
      telegramMessageId: sent.message_id,
      nextScheduledAt
    });

    await notifySuccess(telegram, item);

    console.log(
      `Scheduled post ${item.id} published` +
        (nextScheduledAt
          ? `; next occurrence: ${nextScheduledAt.toISOString()}`
          : "")
    );

    return {
      ok: true,
      item,
      nextScheduledAt
    };
  } catch (error) {
    console.error(
      `Scheduled post ${item.id} was sent but DB completion failed:`,
      error
    );

    await markUncertain(item.id, error.message);
    await notifyFailure(telegram, item, error, true);

    return {
      ok: false,
      item,
      error,
      uncertain: true,
      reason:
        "Telegram принял сообщение, но результат не подтверждён в базе. Проверь канал вручную."
    };
  }
}

async function processDuePosts(telegram) {
  await recoverStuckProcessing(10);

  const duePosts = await findDuePostIds();

  for (const item of duePosts) {
    await processScheduledPostNow(
      telegram,
      item.id
    );
  }
}

function startPublisherScheduler(bot) {
  let running = false;

  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      await processDuePosts(bot.telegram);
    } catch (error) {
      console.error(
        "Publisher scheduler loop error:",
        error
      );
    } finally {
      running = false;
    }
  }, 30000);

  console.log("[ContentPlan] Protected publisher scheduler started.");
}

module.exports = {
  startPublisherScheduler,
  processDuePosts,
  processScheduledPostNow
};
