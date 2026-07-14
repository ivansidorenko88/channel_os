function feedbackKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "💡 Предложить функцию",
            callback_data: "feedback:type:idea"
          }
        ],
        [
          {
            text: "🐞 Сообщить об ошибке",
            callback_data: "feedback:type:bug"
          }
        ],
        [
          {
            text: "◀️ Настройки",
            callback_data: "settings:main"
          }
        ]
      ]
    }
  };
}

module.exports = {
  feedbackKeyboard
};
