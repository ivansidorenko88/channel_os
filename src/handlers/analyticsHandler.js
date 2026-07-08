const { mainMenu } = require("../keyboards/mainMenu");
const { getStats } = require("../services/postService");

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();

    const stats = await getStats(ctx.from);

    return ctx.reply(
      [
        "📊 Аналитика v0.2",
        "",
        `📢 Подключено каналов: ${stats.channelCount}`,
        `📝 Опубликовано постов: ${stats.postCount}`,
        `📄 Черновиков: ${stats.draftCount}`,
        "",
        "В следующих версиях добавим просмотры и расписание публикаций."
      ].join("\n"),
      mainMenu()
    );
  });
}

module.exports = {
  registerAnalyticsHandler
};
