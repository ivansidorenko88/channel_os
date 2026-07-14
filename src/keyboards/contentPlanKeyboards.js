function contentPlanKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📍 Сегодня",
            callback_data: "contentplan:list:today"
          },
          {
            text: "🗓 7 дней",
            callback_data: "contentplan:list:week"
          }
        ],
        [
          {
            text: "📚 Вся очередь",
            callback_data: "contentplan:list:all"
          },
          {
            text: "🔁 Повторяющиеся",
            callback_data: "contentplan:list:recurring"
          }
        ],
        [
          {
            text: "❌ Ошибки публикации",
            callback_data: "contentplan:list:failed"
          }
        ],
        [
          {
            text: "✍️ Создать пост",
            callback_data: "draft:create"
          },
          {
            text: "🧩 Шаблоны",
            callback_data: "contentplan:templates"
          }
        ],
        [
          {
            text: "📄 Черновики",
            callback_data: "dashboard:drafts"
          },
          {
            text: "🏠 Dashboard",
            callback_data: "menu:main"
          }
        ]
      ]
    }
  };
}

function contentPlanListKeyboard(items, range = "all") {
  const rows = items.slice(0, 20).map((item) => [
    {
      text: `${statusIcon(item.status)} ${item.channel.title} · ${formatButtonDate(item.scheduledAt)}`,
      callback_data: `contentplan:item:${item.id}`
    }
  ]);

  rows.push([
    {
      text: "◀️ Контент-план",
      callback_data: "contentplan:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function scheduledItemKeyboard(item) {
  const rows = [];

  if (item.status === "pending") {
    rows.push([
      {
        text: "🚀 Опубликовать сейчас",
        callback_data: `contentplan:publish_now:${item.id}`
      }
    ]);

    rows.push([
      {
        text: "🕒 Перенести",
        callback_data: `contentplan:reschedule:${item.id}`
      },
      {
        text: "✏️ Изменить",
        callback_data: `contentplan:edit:${item.id}`
      }
    ]);

    rows.push([
      {
        text: "🔁 Повтор",
        callback_data: `contentplan:repeat:${item.id}`
      },
      {
        text: "🔔 Напоминание",
        callback_data: `contentplan:reminder:${item.id}`
      }
    ]);

    rows.push([
      {
        text: "🏷 Рубрика",
        callback_data: `contentplan:category:${item.id}`
      },
      {
        text: "🗑 Отменить",
        callback_data: `contentplan:cancel_confirm:${item.id}`
      }
    ]);
  }

  if (item.status === "failed") {
    rows.push([
      {
        text: "🔄 Повторить отправку",
        callback_data: `contentplan:retry:${item.id}`
      }
    ]);

    rows.push([
      {
        text: "🕒 Перенести",
        callback_data: `contentplan:reschedule:${item.id}`
      },
      {
        text: "✏️ Изменить",
        callback_data: `contentplan:edit:${item.id}`
      }
    ]);

    rows.push([
      {
        text: "🗑 Отменить",
        callback_data: `contentplan:cancel_confirm:${item.id}`
      }
    ]);
  }

  rows.push([
    {
      text: "◀️ Контент-план",
      callback_data: "contentplan:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function recurrenceKeyboard(itemId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Без повтора",
            callback_data: `contentplan:set_repeat:${itemId}:none`
          }
        ],
        [
          {
            text: "Каждый день",
            callback_data: `contentplan:set_repeat:${itemId}:daily`
          },
          {
            text: "Каждую неделю",
            callback_data: `contentplan:set_repeat:${itemId}:weekly`
          }
        ],
        [
          {
            text: "Каждый месяц",
            callback_data: `contentplan:set_repeat:${itemId}:monthly`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `contentplan:item:${itemId}`
          }
        ]
      ]
    }
  };
}

function reminderKeyboard(itemId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Выключить",
            callback_data: `contentplan:set_reminder:${itemId}:0`
          }
        ],
        [
          {
            text: "За 15 минут",
            callback_data: `contentplan:set_reminder:${itemId}:15`
          },
          {
            text: "За 30 минут",
            callback_data: `contentplan:set_reminder:${itemId}:30`
          }
        ],
        [
          {
            text: "За 1 час",
            callback_data: `contentplan:set_reminder:${itemId}:60`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `contentplan:item:${itemId}`
          }
        ]
      ]
    }
  };
}

function cancelConfirmKeyboard(itemId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "✅ Да, отменить",
            callback_data: `contentplan:cancel:${itemId}`
          }
        ],
        [
          {
            text: "◀️ Назад",
            callback_data: `contentplan:item:${itemId}`
          }
        ]
      ]
    }
  };
}

function templateListKeyboard(templates) {
  const rows = templates.map((template) => [
    {
      text: `🧩 ${template.name}`,
      callback_data: `contentplan:template:${template.id}`
    }
  ]);

  rows.push([
    {
      text: "◀️ Контент-план",
      callback_data: "contentplan:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function templateActionsKeyboard(templateId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "➕ Создать пост",
            callback_data: `contentplan:template_use:${templateId}`
          }
        ],
        [
          {
            text: "🗑 Удалить шаблон",
            callback_data: `contentplan:template_delete:${templateId}`
          }
        ],
        [
          {
            text: "◀️ К шаблонам",
            callback_data: "contentplan:templates"
          }
        ]
      ]
    }
  };
}

function formatButtonDate(date) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function statusIcon(status) {
  const icons = {
    pending: "⏳",
    processing: "🔄",
    published: "✅",
    failed: "❌",
    uncertain: "⚠️",
    cancelled: "🚫"
  };

  return icons[status] || "•";
}

module.exports = {
  contentPlanKeyboard,
  contentPlanListKeyboard,
  scheduledItemKeyboard,
  recurrenceKeyboard,
  reminderKeyboard,
  cancelConfirmKeyboard,
  templateListKeyboard,
  templateActionsKeyboard
};
