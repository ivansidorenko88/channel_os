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

function buildChannelCard(data) {
  const { channel } = data;
  const username = channel.username
    ? `@${channel.username}`
    : "без username";

  return [
    "📢 Управление каналом",
    "",
    `Название: ${channel.title}`,
    `Username: ${username}`,
    `Telegram ID: ${channel.telegramId}`,
    `Подключён: ${formatDateTime(channel.createdAt)}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📝 Опубликовано постов: ${data.postCount}`,
    `📄 Черновиков: ${data.draftCount}`,
    `⏰ В очереди: ${data.scheduledCount}`,
    `📊 Снимков аналитики: ${data.snapshotCount}`
  ].join("\n");
}

module.exports = {
  buildChannelCard
};
