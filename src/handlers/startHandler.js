const { upsertFromTelegramUser } = require("../repositories/userRepository");
const { mainMenu } = require("../keyboards/mainMenu");
function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    await upsertFromTelegramUser(ctx.from);
    await ctx.reply(["📊 Channel OS v0.1", "", "Панель управления Telegram-каналами прямо в боте.", "", "Сейчас доступно:", "• подключение каналов", "• создание черновиков", "• публикация постов", "• базовая аналитика"].join("\n"), mainMenu());
  });
  bot.action("menu:main", async (ctx) => { await ctx.answerCbQuery(); await ctx.reply("🏠 Главное меню", mainMenu()); });
}
module.exports = { registerStartHandler };
