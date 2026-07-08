require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing. Add it to BotHost environment variables.");
}

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add PostgreSQL connection string to BotHost environment variables.");
}

module.exports = {
  BOT_TOKEN,
  DATABASE_URL
};
