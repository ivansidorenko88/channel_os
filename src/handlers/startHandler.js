const { mainMenu } = require("../keyboards/mainMenu");
const { upsertUser } = require("../repositories/userRepository");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    await upsertUser(ctx.from);

    await ctx.reply(
      [
        "📊 Channel OS v0.3",
        "",
        "Рабочий стол владельца Telegram-канала.",
        "",
        "Доступно:",
        "• подключение каналов",
        "• текстовые и медиа-посты",
        "• черновики",
        "• публикация сейчас",
        "• планировщик"
      ].join("\n"),
      mainMenu()
    );
  });

  bot.action("menu:main", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply("🏠 Главное меню", mainMenu());
  });
}

module.exports = { registerStartHandler };
