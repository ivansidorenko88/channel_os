const { mainMenu } = require("../keyboards/mainMenu");

function registerSettingsHandler(bot) {
  bot.action("settings:main", async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.reply(
      [
        "⚙️ Настройки",
        "",
        "В v0.3 добавим:",
        "• часовой пояс",
        "• уведомления",
        "• формат публикаций"
      ].join("\n"),
      mainMenu()
    );
  });
}

module.exports = {
  registerSettingsHandler
};
