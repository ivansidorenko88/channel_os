require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is missing. Add it to .env or BotHost environment variables.");
}

module.exports = {
  BOT_TOKEN
};
