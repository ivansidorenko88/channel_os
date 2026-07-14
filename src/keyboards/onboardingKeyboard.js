function onboardingKeyboard(progress) {
  const rows = [];

  if (!progress.channelCount) {
    rows.push([
      {
        text: "1️⃣ Подключить канал",
        callback_data: "onboarding:connect"
      }
    ]);
  } else {
    rows.push([
      {
        text: "🔍 Проверить права канала",
        callback_data: "channels:list"
      }
    ]);
  }

  rows.push([
    {
      text: "2️⃣ Создать первый пост",
      callback_data: "onboarding:create"
    }
  ]);

  rows.push([
    {
      text: "📅 Открыть контент-план",
      callback_data: "contentplan:main"
    },
    {
      text: "📊 Открыть аналитику",
      callback_data: "analytics:main"
    }
  ]);

  rows.push([
    {
      text: "✅ Завершить настройку",
      callback_data: "onboarding:complete"
    }
  ]);

  rows.push([
    {
      text: "🏠 Перейти в Dashboard",
      callback_data: "menu:main"
    }
  ]);

  return {
    reply_markup: {
      inline_keyboard: rows
    }
  };
}

function onboardingAfterChannelKeyboard(channelId) {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🔍 Проверить права",
            callback_data: `channels:check:${channelId}`
          }
        ],
        [
          {
            text: "✍️ Создать первый пост",
            callback_data: "onboarding:create"
          }
        ],
        [
          {
            text: "✅ Завершить настройку",
            callback_data: "onboarding:complete"
          }
        ]
      ]
    }
  };
}

module.exports = {
  onboardingKeyboard,
  onboardingAfterChannelKeyboard
};
