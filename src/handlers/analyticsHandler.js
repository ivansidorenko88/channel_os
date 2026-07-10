const { mainMenu } = require("../keyboards/mainMenu");
const { analyticsMenu, analyticsChannelSelectKeyboard, channelAnalyticsKeyboard } = require("../keyboards/analyticsKeyboards");
const legacyAnalytics = require("../services/analyticsService");
const { upsertUser } = require("../repositories/userRepository");
const { getUserChannels } = require("../services/channelService");
const {
getOwnerAnalytics,
  getChannelAnalyticsForOwner,
  collectOwnerSnapshots,
  formatSigned,
  formatDateTime
} = require("../services/analyticsCoreService");

function safeNumber(value) {
  if (value === null || value === undefined) return "нет данных";
  return Number(value).toLocaleString("ru-RU");
}

function buildNoSnapshotHint() {
  return [
    "",
    "⚠️ Если видишь «нет снимка», нажми «🔄 Обновить снимок сейчас».",
    "Бот должен быть администратором канала, иначе Telegram не отдаст количество подписчиков."
  ].join("\n");
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
    `📈 График 7д: ${row.sparkline7d}`,
    "",
    `🕒 Обновлено: ${latest ? formatDateTime(latest.createdAt) : "ожидаем первый снимок"}`,
    !latest ? buildNoSnapshotHint() : ""
  ].filter(Boolean).join("\n");
}

function buildGrowthText(row) {
  return [
    "📈 Рост канала",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `24 часа: ${formatSigned(row.deltaDay)}`,
    `7 дней: ${formatSigned(row.deltaWeek)}`,
    `30 дней: ${formatSigned(row.deltaMonth)}`,
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
    : "Пока нет истории. Нажми «🔄 Обновить снимок сейчас» или дождись scheduler.";

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

async function getRowForCallback(ctx, channelId) {
  const user = await upsertUser(ctx.from);
  return getChannelAnalyticsForOwner(user.id, channelId);
}

function buildOwnerOverview(data) {
  const topRows = data.rows.slice(0, 5).map((row, index) => {
    const subscribers = row.latest ? safeNumber(row.latest.subscriberCount) : "нет снимка";
    return [
      `${index + 1}. ${row.channel.title}`,
      `👥 ${subscribers} | 24ч: ${formatSigned(row.deltaDay)} | 7д: ${formatSigned(row.deltaWeek)}`
    ].join("\n");
  }).join("\n\n") || "Пока нет данных. Нажми «🔄 Обновить снимок сейчас».";

  return [
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
  ].join("\n");
}

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();
    return ctx.reply(
      [
        "📊 Analytics Pro v0.2.1.3",
        "",
        "Аналитика строится по снимкам количества подписчиков.",
        "Автоснимок: каждые 30 минут.\nДля проверки scheduler используй /debug.",
        "",
        "Выбери раздел:"
      ].join("\n"),
      analyticsMenu()
    );
  });

  bot.action("analytics:refresh", async (ctx) => {
    await ctx.answerCbQuery("Собираю снимок...");
    const user = await upsertUser(ctx.from);
    const result = await collectOwnerSnapshots(ctx.telegram, user.id);
    const data = await getOwnerAnalytics(user.id);

    const errors = result.errors.length
      ? "\n\n⚠️ Ошибки:\n" + result.errors.map((item) => `• ${item.title}: ${item.message}`).join("\n")
      : "";

    return ctx.reply(
      [
        "🔄 Снимок аналитики собран",
        "",
        `📢 Каналов: ${result.total}`,
        `✅ Успешно: ${result.success}`,
        `❌ Ошибок: ${result.failed}`,
        errors,
        "",
        buildOwnerOverview(data)
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

  bot.action("analytics:core", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertUser(ctx.from);
    const data = await getOwnerAnalytics(user.id);
    return ctx.reply(buildOwnerOverview(data), analyticsMenu());
  });

  bot.action("analytics:overview", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertUser(ctx.from);
    const data = await getOwnerAnalytics(user.id);
    return ctx.reply(buildOwnerOverview(data), analyticsMenu());
  });

  bot.action(/^analytics:period:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const days = Number(ctx.match[1]);
    const data = await legacyAnalytics.period(ctx.from, days);

    return ctx.reply(
      [
        `📅 События за ${days} дней`,
        "",
        `📝 Постов: ${data.posts}`,
        `➕ Событий подписки: ${data.subscribed}`,
        `➖ Событий отписки: ${data.unsubscribed}`,
        `📊 Баланс событий: ${data.subscribed - data.unsubscribed}`,
        "",
        "Важно: это события Telegram, а не гарантированный полный список подписчиков."
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
    const data = await legacyAnalytics.subscribersReport(ctx.from);

    const recent = data.recent.length
      ? data.recent.map((event) => {
          const icon = event.eventType === "subscribed" ? "➕" : event.eventType === "unsubscribed" ? "➖" : "🔄";
          const name = event.username ? `@${event.username}` : [event.firstName, event.lastName].filter(Boolean).join(" ") || event.telegramUserId;
          return `${icon} ${name}\n📢 ${event.channel.title}\n🕒 ${legacyAnalytics.formatDate(event.createdAt)}`;
        }).join("\n\n")
      : "Пока нет событий.";

    return ctx.reply(
      [
        "👥 События подписок",
        "",
        "За 30 дней:",
        `➕ Событий подписки: ${data.subscribed30}`,
        `➖ Событий отписки: ${data.unsubscribed30}`,
        `📊 Баланс событий: ${data.net30 >= 0 ? "+" : ""}${data.net30}`,
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
