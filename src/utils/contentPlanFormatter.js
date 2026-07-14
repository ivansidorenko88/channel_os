const RECURRENCE_LABELS = {
  none: "без повтора",
  daily: "каждый день",
  weekly: "каждую неделю",
  monthly: "каждый месяц"
};

const STATUS_LABELS = {
  pending: "⏳ ожидает",
  processing: "🔄 публикуется",
  published: "✅ опубликовано",
  failed: "❌ ошибка",
  uncertain: "⚠️ нужно проверить канал",
  cancelled: "🚫 отменено"
};

function formatDateTime(date) {
  if (!date) return "нет данных";

  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function previewContent(item, max = 140) {
  const value =
    item.text ||
    item.caption ||
    `[${item.type}]`;

  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function recurrenceLabel(value) {
  return RECURRENCE_LABELS[value] || value || "без повтора";
}

function reminderLabel(minutes) {
  const value = Number(minutes || 0);

  if (!value) return "выключено";
  if (value === 60) return "за 1 час";

  return `за ${value} минут`;
}

function statusLabel(value) {
  return STATUS_LABELS[value] || value || "неизвестно";
}

function buildContentPlanText(summary) {
  const next = summary.nextPublication
    ? `${summary.nextPublication.channel.title} — ${formatDateTime(summary.nextPublication.scheduledAt)}`
    : "нет";

  return [
    "📅 Channel OS — Content Plan v0.4.2",
    "",
    "Единый центр управления публикациями.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📍 Сегодня: ${summary.todayCount}`,
    `🗓 На 7 дней: ${summary.weekCount}`,
    `📚 Всего в очереди: ${summary.pendingCount}`,
    `❌ Требуют внимания: ${summary.failedCount}`,
    `🔁 Повторяющихся: ${summary.recurringCount}`,
    `📄 Черновиков: ${summary.draftCount}`,
    `🧩 Шаблонов: ${summary.templateCount}`,
    "",
    `📌 Ближайшая публикация: ${next}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    "Выбери раздел:"
  ].join("\n");
}

function buildPlanListText(items, title) {
  if (!items.length) {
    return [
      title,
      "",
      "Публикаций в этом разделе пока нет."
    ].join("\n");
  }

  const lines = items.slice(0, 20).map((item, index) => {
    const repeat =
      item.recurrence !== "none"
        ? ` · 🔁 ${recurrenceLabel(item.recurrence)}`
        : "";

    const category = item.category
      ? `\n🏷 ${item.category}`
      : "";

    return [
      `${index + 1}. ${item.channel.title}`,
      `📊 ${statusLabel(item.status)}`,
      `🕒 ${formatDateTime(item.scheduledAt)}${repeat}`,
      `📝 ${previewContent(item, 90)}${category}`
    ].join("\n");
  });

  return [title, "", ...lines].join("\n\n");
}

function buildScheduledItemText(item) {
  return [
    "📌 Публикация",
    "",
    `📢 Канал: ${item.channel.title}`,
    `🕒 Время: ${formatDateTime(item.scheduledAt)}`,
    `📦 Тип: ${item.type}`,
    `🏷 Рубрика: ${item.category || "не указана"}`,
    `🔁 Повтор: ${recurrenceLabel(item.recurrence)}`,
    `🔔 Напоминание: ${reminderLabel(item.reminderMinutes)}`,
    `📊 Статус: ${statusLabel(item.status)}`,
    `🔄 Попыток отправки: ${item.attemptCount || 0}`,
    item.failureReason
      ? `⚠️ Ошибка: ${String(item.failureReason).slice(0, 500)}`
      : "",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    previewContent(item, 500)
  ].filter(Boolean).join("\n");
}

function buildTemplateText(template) {
  return [
    `🧩 Шаблон: ${template.name}`,
    "",
    `📦 Тип: ${template.type}`,
    `🏷 Рубрика: ${template.category || "не указана"}`,
    "",
    previewContent(template, 500)
  ].join("\n");
}

module.exports = {
  formatDateTime,
  previewContent,
  recurrenceLabel,
  reminderLabel,
  statusLabel,
  buildContentPlanText,
  buildPlanListText,
  buildScheduledItemText,
  buildTemplateText
};
