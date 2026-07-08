const { mainMenu } = require("../keyboards/mainMenu");
const { upsertUser } = require("../repositories/userRepository");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    await upsertUser(ctx.from);

    await ctx.reply(
      [
        "📊 Channel OS v0.2",
        "",
        "Бот для управления Telegram-каналами.",
        "",
        "Сейчас доступно:",
        "• подключение каналов",
        "• создание черновиков",
        "• публикация постов",
        "• PostgreSQL база данных",
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
