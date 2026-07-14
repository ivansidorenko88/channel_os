function permissionValue(member, field, creator = false) {
  if (creator) return true;
  return Boolean(member && member[field]);
}

async function checkChannelPermissions(telegram, channelTelegramId) {
  if (!telegram || typeof telegram.callApi !== "function") {
    throw new TypeError("Telegram API client does not support callApi");
  }

  const bot = await telegram.callApi("getMe", {});
  const member = await telegram.callApi("getChatMember", {
    chat_id: channelTelegramId,
    user_id: bot.id
  });

  const creator = member.status === "creator";
  const administrator =
    creator || member.status === "administrator";

  const canPost = permissionValue(
    member,
    "can_post_messages",
    creator
  );
  const canEdit = permissionValue(
    member,
    "can_edit_messages",
    creator
  );
  const canDelete = permissionValue(
    member,
    "can_delete_messages",
    creator
  );

  const ok = administrator && canPost;

  const summary = [
    `Администратор: ${administrator ? "да" : "нет"}`,
    `Публикация: ${canPost ? "да" : "нет"}`,
    `Редактирование: ${canEdit ? "да" : "нет"}`,
    `Удаление: ${canDelete ? "да" : "нет"}`
  ].join("; ");

  return {
    ok,
    status: member.status,
    administrator,
    canPost,
    canEdit,
    canDelete,
    summary
  };
}

function buildPermissionCheckText(result) {
  return [
    result.ok
      ? "✅ Канал готов к работе"
      : "⚠️ Не хватает обязательных прав",
    "",
    `${result.administrator ? "✅" : "❌"} Бот является администратором`,
    `${result.canPost ? "✅" : "❌"} Публикация сообщений`,
    `${result.canEdit ? "✅" : "⚠️"} Редактирование сообщений`,
    `${result.canDelete ? "✅" : "⚠️"} Удаление сообщений`,
    "",
    result.ok
      ? "Channel OS может публиковать посты. Права редактирования и удаления желательны, но не обязательны для базовой публикации."
      : "Добавь бота администратором и включи право публикации сообщений."
  ].join("\n");
}

module.exports = {
  checkChannelPermissions,
  buildPermissionCheckText
};
