function channelSelectKeyboard(channels, draftId) {
  const rows = channels.map((channel) => [
    {
      text: `📢 ${channel.title}`,
      callback_data:
        `draft:select_channel:${draftId}:${channel.id}`
    }
  ]);

  rows.push([
    {
      text: "◀️ К черновику",
      callback_data: `draft:view:${draftId}`
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function draftListKeyboard(result, searchMode = false) {
  const rows = result.items.map((draft) => [
    {
      text:
        `#${draft.id} · ` +
        `${draft.channel?.title || "канал не выбран"}`,
      callback_data: `draft:view:${draft.id}`
    }
  ]);

  const navigation = [];

  if (result.page > 0) {
    navigation.push({
      text: "◀️",
      callback_data: searchMode
        ? `draft:list:search_page:${result.page - 1}`
        : `draft:list:page:${result.page - 1}`
    });
  }

  navigation.push({
    text: `${result.page + 1}/${result.pages}`,
    callback_data: "draft:list:no_op"
  });

  if (result.page + 1 < result.pages) {
    navigation.push({
      text: "▶️",
      callback_data: searchMode
        ? `draft:list:search_page:${result.page + 1}`
        : `draft:list:page:${result.page + 1}`
    });
  }

  if (result.total > 0) {
    rows.push(navigation);
  }

  const searchRow = [
    {
      text: "🔎 Поиск",
      callback_data: "draft:search"
    }
  ];

  if (searchMode) {
    searchRow.push({
      text: "🧹 Сбросить поиск",
      callback_data: "draft:search_clear"
    });
  }

  rows.push(searchRow);

  rows.push([
    {
      text: "✍️ Создать пост",
      callback_data: "draft:create"
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

function draftActionsKeyboard(draftId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "👁 Предпросмотр",
            callback_data: `draft:preview:${draftId}`
          },
          {
            text: "✏️ Редактировать",
            callback_data: `draft:edit:${draftId}`
          }
        ],
        [
          {
            text: "📑 Дублировать",
            callback_data: `draft:duplicate:${draftId}`
          },
          {
            text: "📢 Выбрать канал",
            callback_data: `draft:change_channel:${draftId}`
          }
        ],
        [
          {
            text: "🏷 Рубрика",
            callback_data: `draft:category:${draftId}`
          },
          {
            text: "🧩 В шаблоны",
            callback_data: `draft:save_template:${draftId}`
          }
        ],
        [
          {
            text: "🚀 Опубликовать",
            callback_data: `draft:publish:${draftId}`
          },
          {
            text: "📅 Запланировать",
            callback_data: `draft:schedule:${draftId}`
          }
        ],
        [
          {
            text: "🗑 Удалить",
            callback_data: `draft:delete_confirm:${draftId}`
          }
        ],
        [
          {
            text: "◀️ Все черновики",
            callback_data: "draft:list"
          }
        ]
      ]
    }
  };
}

function publishConfirmKeyboard(draftId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Да, опубликовать",
            callback_data: `draft:publish_now:${draftId}`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `draft:view:${draftId}`
          }
        ]
      ]
    }
  };
}

function deleteDraftConfirmKeyboard(draftId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🗑 Да, удалить",
            callback_data: `draft:delete:${draftId}`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `draft:view:${draftId}`
          }
        ]
      ]
    }
  };
}

module.exports = {
  channelSelectKeyboard,
  draftListKeyboard,
  draftActionsKeyboard,
  publishConfirmKeyboard,
  deleteDraftConfirmKeyboard
};
