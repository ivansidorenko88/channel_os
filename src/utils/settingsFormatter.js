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
    `📨 Личные уведомления: ${enabled(settings.notificationsEnabled)}`,
    `✅ Подтверждение публикации: ${enabled(settings.confirmBeforePublish)}`,
    `🏷 Рубрика по умолчанию: ${settings.defaultCategory || "не задана"}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "Напоминание применяется к новым постам. У уже запланированных публикаций его можно изменить отдельно."
  ].join("\n");
}

module.exports = {
  buildSettingsText
};
