function adminKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔄 Обновить статистику",
            callback_data: "admin:refresh"
          }
        ],
        [
          {
            text: "🏠 Dashboard",
            callback_data: "menu:main"
          }
        ]
      ]
    }
  };
}

module.exports = {
  adminKeyboard
};
