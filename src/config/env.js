require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

const ADMIN_IDS = String(
  process.env.ADMIN_IDS ||
  process.env.ADMIN_ID ||
  process.env.BOT_ADMIN_ID ||
  ""
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is missing.");
if (!DATABASE_URL) throw new Error("DATABASE_URL is missing.");

module.exports = {
  BOT_TOKEN,
  DATABASE_URL,
  ADMIN_IDS
};
