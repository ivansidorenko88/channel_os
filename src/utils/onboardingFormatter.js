function mark(done) {
  return done ? "✅" : "⬜️";
}

function buildOnboardingText(data) {
  const { progress } = data;
  const contentCreated =
    progress.draftCount +
    progress.postCount +
    progress.scheduledCount > 0;

  return [
    "🚀 Быстрый старт Channel OS",
    "",
    "Настрой бота за несколько шагов:",
    "",
    `${mark(progress.channelCount > 0)} 1. Подключить Telegram-канал`,
    `${mark(contentCreated)} 2. Создать первый пост или черновик`,
    `${mark(progress.postCount + progress.scheduledCount > 0)} 3. Опубликовать или запланировать`,
    `${mark(progress.snapshotCount > 0)} 4. Получить первый снимок аналитики`,
    "",
    "Бота нужно добавить администратором канала с правом публикации сообщений."
  ].join("\n");
}

module.exports = {
  buildOnboardingText
};
