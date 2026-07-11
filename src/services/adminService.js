const { getAdminStatistics } = require("../repositories/adminRepository");

function formatNumber(value) {
  return Number(value || 0).toLocaleString("ru-RU");
}

function formatDateTime(date) {
  if (!date) return "нет данных";

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatUser(user) {
  if (!user) return "нет данных";

  const displayName =
    user.username
      ? `@${user.username}`
      : [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        `ID ${user.telegramId}`;

  return `${displayName} · ${formatDateTime(user.createdAt)}`;
}

async function buildAdminStatistics() {
  const stats = await getAdminStatistics();

  const conversion =
    stats.totalUsers > 0
      ? Math.round((stats.usersWithChannels / stats.totalUsers) * 100)
      : 0;

  return {
    stats,
    text: [
      "🛡 Channel OS — Админ-панель",
      "",
      "👥 Пользователи",
      `Всего: ${formatNumber(stats.totalUsers)}`,
      `Новых за 24 часа: +${formatNumber(stats.users24h)}`,
      `Новых за 7 дней: +${formatNumber(stats.users7d)}`,
      `Новых за 30 дней: +${formatNumber(stats.users30d)}`,
      "",
      "📢 Каналы",
      `Пользователей с каналами: ${formatNumber(stats.usersWithChannels)}`,
      `Подключено каналов: ${formatNumber(stats.totalChannels)}`,
      `Конверсия в подключение канала: ${conversion}%`,
      "",
      "📝 Контент",
      `Опубликовано постов: ${formatNumber(stats.totalPosts)}`,
      `Черновиков: ${formatNumber(stats.totalDrafts)}`,
      `Ожидают публикации: ${formatNumber(stats.pendingScheduledPosts)}`,
      "",
      `🆕 Последний пользователь: ${formatUser(stats.lastRegisteredUser)}`,
      "",
      "ℹ️ Учитываются пользователи, которые хотя бы один раз взаимодействовали с ботом."
    ].join("\n")
  };
}

module.exports = {
  buildAdminStatistics
};
