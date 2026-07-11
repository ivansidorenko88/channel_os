require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

function parseAdminIds(rawValue) {
  if (rawValue === null || rawValue === undefined) {
    return [];
  }

  return String(rawValue)
    .replace(/[\[\]"']/g, "")
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
}

const RAW_ADMIN_IDS =
  process.env.ADMIN_IDS ||
  process.env.ADMIN_ID ||
  process.env.BOT_ADMIN_ID ||
  process.env.OWNER_ID ||
  "";

const ADMIN_IDS = [...new Set(parseAdminIds(RAW_ADMIN_IDS))];

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing.");
if (!DATABASE_URL) throw new Error("DATABASE_URL is missing.");

module.exports = {
  BOT_TOKEN,
  DATABASE_URL,
  ADMIN_IDS,
  RAW_ADMIN_IDS,
  parseAdminIds
};
