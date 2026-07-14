const {
  reminderLabel
} = require("../keyboards/settingsKeyboard");

function enabled(value) {
  return value ? "✅ включено" : "❌ выключено";
}

function buildSettingsText(settings) {
  return [
    "⚙️ Настройки Channel OS",
    "",
    "Настройки применяются ко всем новым публикациям.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `🔔 Напоминание по умолчанию: ${reminderLabel(settings.defaultReminderMinutes)}`,
    `📨 Все личные уведомления: ${enabled(settings.notificationsEnabled)}`,
    `✅ Успешная публикация: ${enabled(settings.notifyOnSuccess)}`,
    `❌ Ошибка публикации: ${enabled(settings.notifyOnFailure)}`,
    `🛡 Подтверждение публикации: ${enabled(settings.confirmBeforePublish)}`,
    `🏷 Рубрика по умолчанию: ${settings.defaultCategory || "не задана"}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "Общий переключатель уведомлений имеет приоритет над отдельными уведомлениями."
  ].join("\n");
}

module.exports = {
  buildSettingsText
};
