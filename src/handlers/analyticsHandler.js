const { mainMenu } = require("../keyboards/mainMenu");
const { analyticsMenu } = require("../keyboards/analyticsKeyboards");
const analytics = require("../services/analyticsService");

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply("📊 Analytics Pro\n\nВыбери раздел:", analyticsMenu());
  });

  bot.action("analytics:overview", async (ctx) => {
    await ctx.answerCbQuery();
    const data = await analytics.overview(ctx.from);

    return ctx.reply(
      [
        "📈 Общий отчет",
        "",
        `📢 Каналов: ${data.channelCount}`,
        `📝 Постов за 7 дней: ${data.posts7}`,
        `🗓 Постов за 30 дней: ${data.posts30}`,
        `📄 Черновиков: ${data.drafts}`,
        `📅 Запланировано: ${data.scheduled}`,
        "",
        "👥 Аудитория за 7 дней:",
        `➕ Подписались: ${data.subscribed7}`,
        `➖ Отписались: ${data.unsubscribed7}`,
        `📊 Баланс: ${data.net7 >= 0 ? "+" : ""}${data.net7}`
      ].join("\n"),
      analyticsMenu()
    );
  });

  bot.action(/^analytics:period:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const days = Number(ctx.match[1]);
    const data = await analytics.period(ctx.from, days);

    return ctx.reply(
      [
        `📅 Отчет за ${days} дней`,
        "",
        `📝 Постов: ${data.posts}`,
        `➕ Подписались: ${data.subscribed}`,
        `➖ Отписались: ${data.unsubscribed}`,
        `📊 Баланс: ${data.subscribed - data.unsubscribed}`
      ].join("\n"),
      analyticsMenu()
    );
  });

  bot.action("analytics:channels", async (ctx) => {
    await ctx.answerCbQuery();
    const rows = await analytics.channelsReport(ctx.from);

    if (!rows.length) return ctx.reply("📢 Каналы пока не подключены.", mainMenu());

    const text = rows.map((row, index) => {
      const subs = row.subscriberCount === null ? "нет снимка" : row.subscriberCount;
      return `${index + 1}. ${row.title}\n👥 Подписчиков: ${subs}\n📝 Постов всего: ${row.postsTotal}\n📅 За 7 дней: ${row.posts7}\n🕒 Последний пост: ${analytics.formatDate(row.lastPostAt)}`;
    }).join("\n\n");

    return ctx.reply(`📢 Аналитика по каналам:\n\n${text}`, analyticsMenu());
  });

  bot.action("analytics:subscribers", async (ctx) => {
    await ctx.answerCbQuery();
    const data = await analytics.subscribersReport(ctx.from);

    const recent = data.recent.length
      ? data.recent.map((event) => {
          const icon = event.eventType === "subscribed" ? "➕" : event.eventType === "unsubscribed" ? "➖" : "🔄";
          const name = event.username ? `@${event.username}` : [event.firstName, event.lastName].filter(Boolean).join(" ") || event.telegramUserId;
          return `${icon} ${name}\n📢 ${event.channel.title}\n🕒 ${analytics.formatDate(event.createdAt)}`;
        }).join("\n\n")
      : "Пока нет событий.";

    return ctx.reply(
      [
        "👥 Подписки/отписки",
        "",
        "За 30 дней:",
        `➕ Подписались: ${data.subscribed30}`,
        `➖ Отписались: ${data.unsubscribed30}`,
        `📊 Баланс: ${data.net30 >= 0 ? "+" : ""}${data.net30}`,
        "",
        "Последние события:",
        recent
      ].join("\n"),
      analyticsMenu()
    );
  });
}

module.exports = { registerAnalyticsHandler };
