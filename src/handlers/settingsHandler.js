const { mainMenu } = require("../keyboards/mainMenu");
const { safeAnswerCbQuery } = require("../utils/safeCallback");
function registerSettingsHandler(bot) {
  bot.action("settings:main", async (ctx) => {
    await safeAnswerCbQuery(ctx);

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
