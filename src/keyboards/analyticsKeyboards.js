function analyticsMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📈 Analytics Core", callback_data: "analytics:core" }],
        [{ text: "📅 За 7 дней", callback_data: "analytics:period:7" }],
        [{ text: "🗓 За 30 дней", callback_data: "analytics:period:30" }],
        [{ text: "📢 По каналам", callback_data: "analytics:channels" }],
        [{ text: "👥 Подписки/отписки", callback_data: "analytics:subscribers" }],
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

module.exports = { analyticsMenu };
