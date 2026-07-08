function channelSelectKeyboard(channels, draftId) {
  const rows = channels.map((channel) => [
    { text: `📢 ${channel.title}`, callback_data: `draft:select_channel:${draftId}:${channel.id}` }
  ]);

  rows.push([{ text: "🏠 Главное меню", callback_data: "menu:main" }]);

  return { reply_markup: { inline_keyboard: rows } };
}

function draftActionsKeyboard(draftId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Опубликовать сейчас", callback_data: `draft:publish:${draftId}` }],
        [{ text: "📅 Запланировать", callback_data: `draft:schedule:${draftId}` }],
        [{ text: "🗑 Удалить", callback_data: `draft:delete:${draftId}` }],
        [{ text: "🏠 Главное меню", callback_data: "menu:main" }]
      ]
    }
  };
}

module.exports = { channelSelectKeyboard, draftActionsKeyboard };
