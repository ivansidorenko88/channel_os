const { mainMenu } = require("../keyboards/mainMenu");
const { upsertUser } = require("../repositories/userRepository");
function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    await upsertUser(ctx.from);

    await ctx.reply(
      [
        "📊 Channel OS v0.2.0",
        "",
        "Analytics Core включен.",
        "",
        "Доступно:",
        "• публикации и планировщик",
        "• медиа-посты",
        "• автоматический сбор статистики",
        "• подготовка базы для Analytics Pro"
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
