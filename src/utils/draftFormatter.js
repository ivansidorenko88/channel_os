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

function buildDraftListText(result) {
  if (!result.items.length) {
    return [
      result.query
        ? "🔎 Результаты поиска"
        : "📄 Черновики",
      "",
      result.query
        ? `По запросу «${result.query}» ничего не найдено.`
        : "Черновиков пока нет.",
      result.query
        ? ""
        : "Нажми «Создать пост», чтобы добавить первый."
    ].join("\n");
  }

  const rows = result.items.map((draft, index) => {
    const channel =
      draft.channel?.title || "канал не выбран";
    const category = draft.category
      ? ` · 🏷 ${draft.category}`
      : "";

    return [
      `${result.page * result.pageSize + index + 1}. #${draft.id} · ${channel}${category}`,
      `${draftContent(draft, 85)}`,
      `🕒 ${formatDateTime(draft.updatedAt)}`
    ].join("\n");
  });

  return [
    result.query
      ? `🔎 Черновики: «${result.query}»`
      : "📄 Мои черновики",
    "",
    `Найдено: ${result.total} · Страница ${result.page + 1}/${result.pages}`,
    "",
    ...rows
  ].join("\n\n");
}

module.exports = {
  draftContent,
  buildDraftCard,
  buildDraftListText
};
