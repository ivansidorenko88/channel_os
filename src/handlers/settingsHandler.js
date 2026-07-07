const { mainMenu } = require("../keyboards/mainMenu");
function registerSettingsHandler(bot) {
  bot.action("settings:main", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply(["⚙️ Настройки", "", "Пока здесь пусто.", "", "В v0.2 добавим:", "• часовой пояс", "• уведомления", "• формат постов"].join("\n"), mainMenu());
  });
}
module.exports = { registerSettingsHandler };
