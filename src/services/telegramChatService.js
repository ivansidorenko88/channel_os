async function getChatMemberCount(telegram, chatId) {
  if (!telegram || typeof telegram.callApi !== "function") {
    throw new TypeError("Telegram API client does not support callApi");
  }

  const count = await telegram.callApi("getChatMemberCount", {
    chat_id: chatId
  });

  const normalizedCount = Number(count);

  if (!Number.isFinite(normalizedCount)) {
    throw new TypeError(`Telegram returned invalid member count: ${count}`);
  }

  return normalizedCount;
}

module.exports = {
  getChatMemberCount
};
