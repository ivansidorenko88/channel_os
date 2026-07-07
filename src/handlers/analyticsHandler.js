const { mainMenu } = require("../keyboards/mainMenu");
const { upsertFromTelegramUser } = require("../repositories/userRepository");
const { getPostStats } = require("../repositories/postRepository");
function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertFromTelegramUser(ctx.from);
    const stats = await getPostStats(user.id);
    return ctx.reply(["📊 Аналитика v0.1", "", `📢 Подключено каналов: ${stats.channelCount}`, `📝 Опубликовано постов: ${stats.totalPosts}`, "", "В следующих версиях добавим:", "• просмотры постов", "• календарь публикаций", "• отчеты за день/неделю"].join("\n"), mainMenu());
  });
}
module.exports = { registerAnalyticsHandler };
