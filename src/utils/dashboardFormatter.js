const {
  formatSigned,
  formatDateTime
} = require("../services/analyticsCoreService");

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function firstName(user) {
  return user.firstName || user.username || "пользователь";
}

function formatScheduleDate(date) {
  if (!date) return "нет";

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function schedulerStatus(scheduler) {
  if (!scheduler?.started) return "🔴 не запущена";
  if (scheduler.lastError) return "🟠 есть ошибка";
  return "🟢 работает";
}

function buildDashboardText(data) {
  const { user, analytics, draftCount, scheduledCount, postCount } = data;
  const nextPublication = data.nextPublication;

  const lines = [
    "🏠 Channel OS — Dashboard v0.3",
    "",
    `👋 Привет, ${firstName(user)}!`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📢 Каналов: ${analytics.channelCount}`,
    `👥 Подписчиков: ${formatNumber(analytics.totalSubscribers)}`,
    "",
    `📈 Рост за 24 часа: ${formatSigned(analytics.totalDeltaDay)}`,
    `📅 Рост за 7 дней: ${formatSigned(analytics.totalDeltaWeek)}`,
    `🗓 Рост за 30 дней: ${formatSigned(analytics.totalDeltaMonth)}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📝 Опубликовано постов: ${formatNumber(postCount)}`,
    `⏰ Запланировано: ${formatNumber(scheduledCount)}`,
    `📄 Черновиков: ${formatNumber(draftCount)}`,
    "",
    nextPublication
      ? `📌 Ближайшая публикация: ${nextPublication.channel.title} — ${formatScheduleDate(nextPublication.scheduledAt)}`
      : "📌 Ближайшая публикация: нет",
    "",
    `🕒 Последний снимок: ${formatDateTime(analytics.latestSnapshotAt)}`,
    `📊 Аналитика: ${schedulerStatus(data.scheduler)}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "⚡ Выбери действие:"
  ];

  if (!analytics.channelCount) {
    lines.splice(
      4,
      0,
      "ℹ️ Подключи первый канал, чтобы Dashboard начал собирать данные.",
      ""
    );
  }

  return lines.join("\n");
}

function buildRefreshResultText(result) {
  if (!result.total) {
    return "Каналы ещё не подключены.";
  }

  return [
    `✅ Обновлено: ${result.success}`,
    `❌ Ошибок: ${result.failed}`
  ].join(" · ");
}

module.exports = {
  buildDashboardText,
  buildRefreshResultText
};
