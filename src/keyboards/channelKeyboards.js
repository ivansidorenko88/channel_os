function channelListKeyboard(channels) {
  const rows = channels.map((channel) => [
    {
      text: `📢 ${channel.title}`,
      callback_data: `channels:view:${channel.id}`
    }
  ]);

  rows.push([
    {
      text: "➕ Подключить канал",
      callback_data: "channels:add"
    }
  ]);

  rows.push([
    {
      text: "🏠 Dashboard",
      callback_data: "menu:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function channelActionsKeyboard(channelId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📊 Аналитика",
            callback_data:
              `analytics:channel:${channelId}`
          }
        ],
        [
          {
            text: "🗑 Удалить из Channel OS",
            callback_data:
              `channels:delete_confirm:${channelId}`
          }
        ],
        [
          {
            text: "◀️ Мои каналы",
            callback_data: "channels:list"
          }
        ]
      ]
    }
  };
}

function channelDeleteConfirmKeyboard(channelId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🗑 Да, отключить",
            callback_data:
              `channels:disconnect:${channelId}`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `channels:view:${channelId}`
          }
        ]
      ]
    }
  };
}

module.exports = {
  channelListKeyboard,
  channelActionsKeyboard,
  channelDeleteConfirmKeyboard
};
