const { ADMIN_IDS } = require("../config/env");

function normalizeTelegramId(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isAdminTelegramId(telegramId) {
  const normalized = normalizeTelegramId(telegramId);
  return Boolean(normalized) && ADMIN_IDS.includes(normalized);
}

function isAdminContext(ctx) {
  return isAdminTelegramId(ctx?.from?.id);
}

module.exports = {
  isAdminTelegramId,
  isAdminContext
};
