const { ADMIN_IDS, RAW_ADMIN_IDS } = require("../config/env");

function normalizeTelegramId(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[^\d]/g, "").trim();
}

function isAdminTelegramId(telegramId) {
  const normalized = normalizeTelegramId(telegramId);
  return Boolean(normalized) && ADMIN_IDS.includes(normalized);
}

function isAdminContext(ctx) {
  return isAdminTelegramId(ctx?.from?.id);
}

function getAdminAccessDiagnostics(telegramId) {
  const normalized = normalizeTelegramId(telegramId);

  return {
    telegramId: normalized,
    configuredAdminCount: ADMIN_IDS.length,
    environmentValuePresent: Boolean(String(RAW_ADMIN_IDS || "").trim()),
    hasAccess: isAdminTelegramId(normalized)
  };
}

module.exports = {
  isAdminTelegramId,
  isAdminContext,
  getAdminAccessDiagnostics
};
