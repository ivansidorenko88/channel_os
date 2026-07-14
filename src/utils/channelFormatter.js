function formatDateTime(date) {
  if (!date) return "не проверялось";

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildChannelCard(data) {
  const { channel } = data;
  const username = channel.username
    ? `@${channel.username}`
    : "без username";

  const permissionStatus =
    channel.lastPermissionOk === true
      ? "✅ готов к публикации"
      : channel.lastPermissionOk === false
        ? "⚠️ требуется проверка прав"
        : "➖ ещё не проверялся";

  return [
    "📢 Управление каналом",
    "",
    `Название: ${channel.title}`,
    `Username: ${username}`,
    `Telegram ID: ${channel.telegramId}`,
    `Подключён: ${formatDateTime(channel.createdAt)}`,
    "",
    `🔐 Права: ${permissionStatus}`,
    `Последняя проверка: ${formatDateTime(channel.lastPermissionCheckAt)}`,
    channel.lastPermissionSummary
      ? `Результат: ${channel.lastPermissionSummary}`
      : "",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📝 Опубликовано постов: ${data.postCount}`,
    `📄 Черновиков: ${data.draftCount}`,
    `⏰ В очереди: ${data.scheduledCount}`,
    `📊 Снимков аналитики: ${data.snapshotCount}`
  ].filter(Boolean).join("\n");
}

module.exports = {
  buildChannelCard
};
