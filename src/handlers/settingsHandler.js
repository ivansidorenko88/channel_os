const { mainMenu } = require("../keyboards/mainMenu");
function registerSettingsHandler(bot) {
  bot.action("settings:main", async (ctx) => {
    await ctx.answerCbQuery();

    return ctx.reply(
      [
        "⚙️ Настройки",
        "",
        "Следующий шаг:",
        "• часовой пояс",
        "• уведомления",
        "• роли команды"
      ].join("\n"),
      mainMenu()
    );
  });
}

module.exports = { registerSettingsHandler };
