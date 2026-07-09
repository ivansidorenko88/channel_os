const { mainMenu } = require("../keyboards/mainMenu");
const { analyticsMenu, analyticsChannelSelectKeyboard, channelAnalyticsKeyboard } = require("../keyboards/analyticsKeyboards");
const analytics = require("../services/analyticsService");
const { upsertUser } = require("../repositories/userRepository");
const { getUserChannels } = require("../services/channelService");
const {
  getOwnerAnalytics,
  getChannelAnalyticsForOwner,
  formatSigned,
  formatDateTime
} = require("../services/analyticsCoreService");

function safeNumber(value) {
  if (value === null || value === undefined) return "нет данных";
  return Number(value).toLocaleString("ru-RU");
}

function buildChannelCard(row) {
  const latest = row.latest;
  const subscribers = latest ? safeNumber(latest.subscriberCount) : "нет снимка";
  const postCount = latest ? latest.postCount : 0;
  const scheduledCount = latest ? latest.scheduledCount : 0;
  const draftCount = latest ? latest.draftCount : 0;

  return [
    "📊 Analytics Pro",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `👥 Подписчиков: ${subscribers}`,
    `📈 24 часа: ${formatSigned(row.deltaDay)}`,
    `📅 7 дней: ${formatSigned(row.deltaWeek)}`,
    `🗓 30 дней: ${formatSigned(row.deltaMonth)}`,
    "",
    `📝 Постов: ${postCount}`,
    `⏰ Запланировано: ${scheduledCount}`,
    `📄 Черновиков: ${draftCount}`,
    "",
    "",
    `📈 График 7д: ${row.sparkline7d}`,
    "",
    `🕒 Обновлено: ${latest ? formatDateTime(latest.createdAt) : "ожидаем первый снимок"}`
  ].join("\n");
}

function buildGrowthText(row) {
  return [
    "📈 Рост канала",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `Сегодня / 24ч: ${formatSigned(row.deltaDay)}`,
    `Неделя: ${formatSigned(row.deltaWeek)}`,
    `Месяц: ${formatSigned(row.deltaMonth)}`,
    "",
    `Мини-график 24ч: ${row.sparkline24h}`,
    `Мини-график 7д: ${row.sparkline7d}`,
    "",
    "Данные считаются по снимкам количества подписчиков."
  ].join("\n");
}

function buildHistoryText(row) {
  const history = row.recentSnapshots.length
    ? row.recentSnapshots.map((snapshot) => {
        return `${formatDateTime(snapshot.createdAt)} — ${safeNumber(snapshot.subscriberCount)}`;
      }).join("\n")
    : "Пока нет истории. Дождись первого снимка scheduler.";

  return [
    "📅 История снимков",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    history
  ].join("\n");
}

function buildReportText(row) {
  const latest = row.latest;
  const best = row.bestInterval24h;

  const bestText = best
    ? `${formatDateTime(best.from)} → ${formatDateTime(best.to)}: ${formatSigned(best.delta)}`
    : "недостаточно данных";

  return [
    "📄 Отчёт за 24 часа",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `👥 Сейчас: ${latest ? safeNumber(latest.subscriberCount) : "нет снимка"}`,
    `📈 Рост: ${formatSigned(row.deltaDay)}`,
    `📝 Постов всего: ${latest ? latest.postCount : 0}`,
    `⏰ Запланировано: ${latest ? latest.scheduledCount : 0}`,
    `📄 Черновиков: ${latest ? latest.draftCount : 0}`,
    "",
    `🔥 Лучший интервал: ${bestText}`,
    "",
    "Следующий шаг: в v0.2.2 добавим ежедневные отчёты и экспорт."
  ].join("\n");
}

  const tips = [];

  if (!row.latest) tips.push("🔴 Нет снимков аналитики — дождись работы scheduler.");
  if (row.deltaDay > 0) tips.push("🟢 За 24 часа есть рост аудитории.");
  if (row.deltaDay === 0) tips.push("🟡 За 24 часа аудитория без изменений.");
  if (row.deltaDay < 0) tips.push("🔴 За 24 часа есть падение аудитории.");
  if (row.latest && row.latest.scheduledCount > 0) tips.push("🟢 Есть запланированный контент.");
  if (row.latest && row.latest.scheduledCount === 0) tips.push("🟡 Нет запланированных публикаций.");
  if (row.latest && row.latest.postCount > 0) tips.push("🟢 Канал уже публиковался через Channel OS.");

  return [
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    "",
    ...tips,
    "",
  ].join("\n");
}

async function getRowForCallback(ctx, channelId) {
  const user = await upsertUser(ctx.from);
  return getChannelAnalyticsForOwner(user.id, channelId);
}

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply(
      [
        "📊 Analytics Pro v0.2.1",
        "",
        "",
        "Выбери раздел:"
      ].join("\n"),
      analyticsMenu()
    );
  });

  bot.action("analytics:select_channel", async (ctx) => {
    await ctx.answerCbQuery();
    const channels = await getUserChannels(ctx.from);

    if (!channels.length) {
      return ctx.reply("📢 У тебя пока нет подключенных каналов.", mainMenu());
    }

    return ctx.reply("📊 Analytics Pro\n\nВыбери канал:", analyticsChannelSelectKeyboard(channels));
  });

  bot.action(/^analytics:channel:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) return ctx.reply("❌ Канал не найден.", analyticsMenu());

    return ctx.reply(buildChannelCard(row), channelAnalyticsKeyboard(row.channel.id));
  });

  bot.action(/^analytics:growth:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) return ctx.reply("❌ Канал не найден.", analyticsMenu());

    return ctx.reply(buildGrowthText(row), channelAnalyticsKeyboard(row.channel.id));
  });

  bot.action(/^analytics:history:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) return ctx.reply("❌ Канал не найден.", analyticsMenu());

    return ctx.reply(buildHistoryText(row), channelAnalyticsKeyboard(row.channel.id));
  });

  bot.action(/^analytics:report:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) return ctx.reply("❌ Канал не найден.", analyticsMenu());

    return ctx.reply(buildReportText(row), channelAnalyticsKeyboard(row.channel.id));
  });

    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) return ctx.reply("❌ Канал не найден.", analyticsMenu());

  });

  bot.action("analytics:core", async (ctx) => {
    await ctx.answerCbQuery();

    const user = await upsertUser(ctx.from);
    const data = await getOwnerAnalytics(user.id);

    const topRows = data.rows.slice(0, 5).map((row, index) => {
      const subscribers = row.latest ? safeNumber(row.latest.subscriberCount) : "нет снимка";
      const day = formatSigned(row.deltaDay);
      const week = formatSigned(row.deltaWeek);
    }).join("\n\n") || "Пока нет данных. Первый снимок появится после запуска scheduler.";

    return ctx.reply(
      [
        "📈 Общий обзор Analytics Pro",
        "",
        `📢 Каналов: ${data.channelCount}`,
        `👥 Подписчиков всего: ${safeNumber(data.totalSubscribers)}`,
        `📈 Рост за 24ч: ${formatSigned(data.totalDeltaDay)}`,
        `📅 Рост за 7д: ${formatSigned(data.totalDeltaWeek)}`,
        `🗓 Рост за 30д: ${formatSigned(data.totalDeltaMonth)}`,
        "",
        "📢 Каналы:",
        topRows
      ].join("\n"),
      analyticsMenu()
    );
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
    const channels = await getUserChannels(ctx.from);

    if (!channels.length) return ctx.reply("📢 Каналы пока не подключены.", mainMenu());

    return ctx.reply("📢 Выбери канал для подробной аналитики:", analyticsChannelSelectKeyboard(channels));
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
        recent,
        "",
        "Важно: Telegram не всегда отдаёт личности подписчиков/отписавшихся. Надёжная аналитика строится на снимках общего числа подписчиков."
      ].join("\n"),
      analyticsMenu()
    );
  });
}

module.exports = { registerAnalyticsHandler };
