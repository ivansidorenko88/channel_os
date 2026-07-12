const RECURRENCE_LABELS = {
  none: "без повтора",
  daily: "каждый день",
  weekly: "каждую неделю",
  monthly: "каждый месяц"
};

function formatDateTime(date) {
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

function buildContentPlanText(summary) {
  const next = summary.nextPublication
    ? `${summary.nextPublication.channel.title} — ${formatDateTime(summary.nextPublication.scheduledAt)}`
    : "нет";

  return [
    "📅 Channel OS — Content Plan v0.4",
    "",
    "Единый центр управления публикациями.",
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `📍 Сегодня: ${summary.todayCount}`,
    `🗓 На 7 дней: ${summary.weekCount}`,
    `📚 Всего в очереди: ${summary.pendingCount}`,
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
      "Публикаций в этом периоде пока нет."
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
      `🕒 ${formatDateTime(item.scheduledAt)}${repeat}`,
      `📝 ${previewContent(item, 90)}${category}`
    ].join("\n");
  });

  return [title, "", ...lines].join("\n\n");
}

function buildScheduledItemText(item) {
  return [
    "📌 Запланированная публикация",
    "",
    `📢 Канал: ${item.channel.title}`,
    `🕒 Время: ${formatDateTime(item.scheduledAt)}`,
    `📦 Тип: ${item.type}`,
    `🏷 Рубрика: ${item.category || "не указана"}`,
    `🔁 Повтор: ${recurrenceLabel(item.recurrence)}`,
    `🔔 Напоминание: ${reminderLabel(item.reminderMinutes)}`,
    `📊 Статус: ${item.status}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    previewContent(item, 500)
  ].join("\n");
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
  buildContentPlanText,
  buildPlanListText,
  buildScheduledItemText,
  buildTemplateText
};
