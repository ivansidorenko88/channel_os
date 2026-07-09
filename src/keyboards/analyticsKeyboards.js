function analyticsMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📢 Выбрать канал", callback_data: "analytics:select_channel" }],
        [{ text: "📈 Общий обзор", callback_data: "analytics:core" }],
        [{ text: "📅 За 7 дней", callback_data: "analytics:period:7" }],
        [{ text: "🗓 За 30 дней", callback_data: "analytics:period:30" }],
        [{ text: "👥 Подписки/отписки", callback_data: "analytics:subscribers" }],
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

function analyticsChannelSelectKeyboard(channels) {
  const rows = channels.map((channel) => [
    { text: `📢 ${channel.title}`, callback_data: `analytics:channel:${channel.id}` }
  ]);

  rows.push([{ text: "◀️ Назад", callback_data: "analytics:main" }]);
  rows.push([{ text: "🏠 Главное меню", callback_data: "menu:main" }]);

  return { reply_markup: { inline_keyboard: rows } };
}

function channelAnalyticsKeyboard(channelId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📈 Рост", callback_data: `analytics:growth:${channelId}` },
          { text: "📅 История", callback_data: `analytics:history:${channelId}` }
        ],
        [
          { text: "📄 Отчёт 24ч", callback_data: `analytics:report:${channelId}` },
          { text: "🟢 Health", callback_data: `analytics:health:${channelId}` }
        ],
        [{ text: "◀️ К каналам", callback_data: "analytics:select_channel" }],
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

module.exports = { analyticsMenu, analyticsChannelSelectKeyboard, channelAnalyticsKeyboard };
