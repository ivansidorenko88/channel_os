const { mainMenu } = require("../keyboards/mainMenu");
const { getStats } = require("../services/postService");

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();

    const stats = await getStats(ctx.from);

    return ctx.reply(
      [
        "📊 Аналитика v0.3",
        "",
        `📢 Подключено каналов: ${stats.channelCount}`,
        `📝 Опубликовано постов: ${stats.postCount}`,
        `📄 Черновиков: ${stats.draftCount}`,
        `📅 Запланировано: ${stats.scheduledCount}`
      ].join("\n"),
      mainMenu()
    );
  });
}

module.exports = { registerAnalyticsHandler };
