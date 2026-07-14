function settingsKeyboard(settings) {
  const notifications =
    settings.notificationsEnabled ? "включены" : "выключены";
  const success =
    settings.notifyOnSuccess ? "включены" : "выключены";
  const failure =
    settings.notifyOnFailure ? "включены" : "выключены";
  const confirmation =
    settings.confirmBeforePublish ? "включено" : "выключено";

  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `🔔 Напоминание: ${reminderLabel(settings.defaultReminderMinutes)}`,
            callback_data: "settings:reminder"
          }
        ],
        [
          {
            text: `📨 Все уведомления: ${notifications}`,
            callback_data: "settings:toggle_notifications"
          }
        ],
        [
          {
            text: `✅ Об успешной публикации: ${success}`,
            callback_data: "settings:toggle_success"
          }
        ],
        [
          {
            text: `❌ Об ошибке публикации: ${failure}`,
            callback_data: "settings:toggle_failure"
          }
        ],
        [
          {
            text: `🛡 Подтверждение публикации: ${confirmation}`,
            callback_data: "settings:toggle_confirmation"
          }
        ],
        [
          {
            text: `🏷 Рубрика: ${settings.defaultCategory || "не задана"}`,
            callback_data: "settings:category"
          }
        ],
        [
          {
            text: "📢 Управление каналами",
            callback_data: "channels:list"
          },
          {
            text: "🚀 Быстрый старт",
            callback_data: "onboarding:show"
          }
        ],
        [
          {
            text: "💬 Обратная связь",
            callback_data: "feedback:main"
          }
        ],
        [
          {
            text: "♻️ Сбросить настройки",
            callback_data: "settings:reset_confirm"
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

function reminderSettingsKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Выключить", callback_data: "settings:set_reminder:0" }],
        [
          { text: "За 15 минут", callback_data: "settings:set_reminder:15" },
          { text: "За 30 минут", callback_data: "settings:set_reminder:30" }
        ],
        [{ text: "За 1 час", callback_data: "settings:set_reminder:60" }],
        [{ text: "◀️ Настройки", callback_data: "settings:main" }]
      ]
    }
  };
}

function categorySettingsKeyboard(hasCategory) {
  const rows = [];

  if (hasCategory) {
    rows.push([
      {
        text: "🧹 Убрать рубрику",
        callback_data: "settings:clear_category"
      }
    ]);
  }

  rows.push([
    {
      text: "◀️ Настройки",
      callback_data: "settings:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function resetSettingsKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [{ text: "♻️ Да, сбросить", callback_data: "settings:reset" }],
        [{ text: "◀️ Назад", callback_data: "settings:main" }]
      ]
    }
  };
}

function reminderLabel(minutes) {
  const value = Number(minutes || 0);

  if (!value) return "выкл.";
  if (value === 60) return "1 час";

  return `${value} мин.`;
}

module.exports = {
  settingsKeyboard,
  reminderSettingsKeyboard,
  categorySettingsKeyboard,
  resetSettingsKeyboard,
  reminderLabel
};
