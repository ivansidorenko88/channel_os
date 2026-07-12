function formatDateTime(date) {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function draftContent(draft, maxLength = 600) {
  const content =
    draft.text ||
    draft.caption ||
    `[${draft.type}]`;

  return String(content)
    .trim()
    .slice(0, maxLength);
}

function buildDraftCard(draft) {
  return [
    `📄 Черновик #${draft.id}`,
    "",
    `📦 Тип: ${draft.type}`,
    `📢 Канал: ${draft.channel?.title || "не выбран"}`,
    `🏷 Рубрика: ${draft.category || "не указана"}`,
    `🕒 Изменён: ${formatDateTime(draft.updatedAt)}`,
    "",
    "━━━━━━━━━━━━━━━━━━",
    "",
    draftContent(draft)
  ].join("\n");
}

function buildDraftListText(drafts) {
  if (!drafts.length) {
    return [
      "📄 Черновики",
      "",
      "Черновиков пока нет.",
      "Нажми «Создать пост», чтобы добавить первый."
    ].join("\n");
  }

  const rows = drafts.map((draft, index) => {
    const channel =
      draft.channel?.title || "канал не выбран";
    const category = draft.category
      ? ` · 🏷 ${draft.category}`
      : "";

    return [
      `${index + 1}. #${draft.id} · ${channel}${category}`,
      draftContent(draft, 90)
    ].join("\n");
  });

  return [
    "📄 Мои черновики",
    "",
    ...rows
  ].join("\n\n");
}

module.exports = {
  draftContent,
  buildDraftCard,
  buildDraftListText
};
