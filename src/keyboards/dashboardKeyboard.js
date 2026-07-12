function dashboardKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📢 Каналы", callback_data: "channels:list" },
          { text: "📊 Аналитика", callback_data: "analytics:main" }
        ],
        [
          { text: "✍️ Создать пост", callback_data: "draft:create" },
          { text: "📅 Контент-план", callback_data: "contentplan:main" }
        ],
        [
          { text: "📄 Черновики", callback_data: "draft:list" },
          { text: "👥 События", callback_data: "analytics:subscribers" }
        ],
        [
          { text: "⚙️ Настройки", callback_data: "settings:main" },
          { text: "🔄 Обновить", callback_data: "dashboard:refresh" }
        ]
      ]
    }
  };
}

function dashboardBackKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏠 Dashboard", callback_data: "dashboard:open" }]
      ]
    }
  };
}

module.exports = {
  dashboardKeyboard,
  dashboardBackKeyboard
};
