const { mainMenu } = require("../keyboards/mainMenu");
const { upsertUser } = require("../services/userService");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    upsertUser(ctx.from);

    await ctx.reply(
      [
        "📊 Channel OS v0.1.1",
        "",
        "Бот для управления Telegram-каналами.",
        "",
        "Сейчас доступно:",
        "• подключение каналов",
        "• создание черновиков",
        "• публикация постов",
        "• базовая аналитика"
      ].join("\n"),
      mainMenu()
    );
  });

  bot.action("menu:main", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("🏠 Главное меню", mainMenu());
  });
}

module.exports = {
  registerStartHandler
};
