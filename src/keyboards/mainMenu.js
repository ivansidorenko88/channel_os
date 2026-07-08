function mainMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📢 Мои каналы", callback_data: "channels:list" }],
        [{ text: "➕ Добавить канал", callback_data: "channels:add" }],
        [{ text: "📝 Создать пост", callback_data: "draft:create" }],
        [{ text: "📊 Аналитика", callback_data: "analytics:main" }],
        [{ text: "⚙️ Настройки", callback_data: "settings:main" }]
      ]
    }
  };
}

function backToMenu() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

module.exports = {
  mainMenu,
  backToMenu
};
