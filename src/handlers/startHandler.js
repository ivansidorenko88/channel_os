const { mainMenu } = require("../keyboards/mainMenu");
const { upsertUser } = require("../repositories/userRepository");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    await upsertUser(ctx.from);

    await ctx.reply(
      [
        "📊 Channel OS v0.4",
        "",
        "Analytics Pro включен.",
        "",
        "Доступно:",
        "• публикации и планировщик",
        "• медиа-посты",
        "• расширенная аналитика",
        "• подписки/отписки, если Telegram отдаёт события"
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
