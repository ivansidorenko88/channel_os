const { mainMenu } = require("../keyboards/mainMenu");
const {
  analyticsMenu,
  analyticsChannelSelectKeyboard,
  channelAnalyticsKeyboard
} = require("../keyboards/analyticsKeyboards");
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

function isEditFallbackError(error) {
  const description =
    error?.response?.description ||
    error?.message ||
    "";

  return (
    description.includes("message is not modified") ||
    description.includes("message can't be edited") ||
    description.includes("message to edit not found") ||
    description.includes("there is no text in the message to edit")
  );
}

async function showScreen(ctx, text, keyboard, options = {}) {
  if (ctx.callbackQuery && options.edit !== false) {
    try {
      return await ctx.editMessageText(text, keyboard);
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

function buildCollectingHint(row) {
  if (!row.latest) {
    return [
      "⏳ Снимков пока нет.",
      "Нажми «🔄 Обновить снимок», чтобы создать первый."
    ].join("\n");
  }

  if (!row.history.has24h) {
    return [
      `⏳ Доступная история: ${row.history.availableText}`,
      `Отчёт за 24 часа появится примерно через ${row.history.remaining24hText}`
    ].join("\n");
  }

  return `🗂 История собирается: ${row.history.availableText}`;
}

function buildChannelCard(row) {
  const latest = row.latest;

  return [
    "📊 Analytics Pro",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `👥 Подписчиков: ${latest ? safeNumber(latest.subscriberCount) : "нет снимка"}`,
    `📈 24 часа: ${formatSigned(row.deltaDay)}`,
    `📅 7 дней: ${formatSigned(row.deltaWeek)}`,
    `🗓 30 дней: ${formatSigned(row.deltaMonth)}`,
    "",
    `📝 Постов: ${latest ? latest.postCount : 0}`,
    `⏰ Запланировано: ${latest ? latest.scheduledCount : 0}`,
    `📄 Черновиков: ${latest ? latest.draftCount : 0}`,
    "",
    buildCollectingHint(row),
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
    `24 часа: ${formatSigned(row.deltaDay)}`,
    `7 дней: ${formatSigned(row.deltaWeek)}`,
    `30 дней: ${formatSigned(row.deltaMonth)}`,
    "",
    "Динамика последних снимков:",
    `24ч: ${row.trend24h}`,
    `7д: ${row.trend7d}`,
    "",
    buildCollectingHint(row),
    "",
    "Данные считаются по снимкам количества подписчиков."
  ].join("\n");
}

function buildHistoryText(row) {
  const history = row.recentSnapshots.length
    ? row.recentSnapshots
        .map(
          (snapshot) =>
            `${formatDateTime(snapshot.createdAt)} — ${safeNumber(snapshot.subscriberCount)}`
        )
        .join("\n")
    : "Пока нет истории. Нажми «🔄 Обновить снимок».";

  return [
    "📅 История снимков",
    "",
    `📢 ${row.channel.title}`,
    "━━━━━━━━━━━━━━",
    "",
    `Доступная история: ${row.history.availableText}`,
    "",
    history
  ].join("\n");
}

function buildReportText(row) {
  const latest = row.latest;
  const best = row.bestInterval24h;

  if (!row.history.has24h) {
    return [
      "📄 Отчёт за 24 часа",
      "",
      `📢 ${row.channel.title}`,
      "━━━━━━━━━━━━━━",
      "",
      "⏳ Отчёт ещё формируется.",
      `Доступная история: ${row.history.availableText}`,
      `Осталось примерно: ${row.history.remaining24hText}`,
      "",
      "Снимки создаются автоматически каждые 30 минут."
    ].join("\n");
  }

  const bestText = best
    ? `${formatDateTime(best.from)} → ${formatDateTime(best.to)}: ${formatSigned(best.delta)}`
    : "изменений не найдено";

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
    `Динамика: ${row.trend24h}`
  ].join("\n");
}

async function getRowForCallback(ctx, channelId) {
  const user = await upsertUser(ctx.from);
  return getChannelAnalyticsForOwner(user.id, channelId);
}

function buildOwnerOverview(data) {
  const topRows =
    data.rows
      .slice(0, 5)
      .map((row, index) => {
        const subscribers = row.latest
          ? safeNumber(row.latest.subscriberCount)
          : "нет снимка";

        return `${index + 1}. ${row.channel.title}\n👥 ${subscribers} · 24ч: ${formatSigned(row.deltaDay)} · 7д: ${formatSigned(row.deltaWeek)}`;
      })
      .join("\n\n") ||
    "Пока нет данных. Нажми «🔄 Обновить снимок сейчас».";

  const historyText = data.latestSnapshotAt
    ? `🗂 Доступная история: ${data.historyAvailableText}`
    : "⏳ История ещё не собрана";

  return [
    "📈 Общий обзор Analytics Pro",
    "",
    `📢 Каналов: ${data.channelCount}`,
    `👥 Подписчиков всего: ${safeNumber(data.totalSubscribers)}`,
    `📈 Рост за 24ч: ${formatSigned(data.totalDeltaDay)}`,
    `📅 Рост за 7д: ${formatSigned(data.totalDeltaWeek)}`,
    `🗓 Рост за 30д: ${formatSigned(data.totalDeltaMonth)}`,
    "",
    historyText,
    "",
    "📢 Каналы:",
    topRows
  ].join("\n");
}

function registerAnalyticsHandler(bot) {
  bot.action("analytics:main", async (ctx) => {
    await ctx.answerCbQuery();

    return showScreen(
      ctx,
      [
        "📊 Analytics Pro v0.3.1",
        "",
        "Аналитика строится по снимкам количества подписчиков.",
        "Автоснимок: каждые 30 минут.",
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
      ? "\n\n⚠️ Ошибки:\n" +
        result.errors
          .map((item) => `• ${item.title}: ${item.message}`)
          .join("\n")
      : "";

    return showScreen(
      ctx,
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
      return showScreen(
        ctx,
        "📢 У тебя пока нет подключенных каналов.",
        mainMenu()
      );
    }

    return showScreen(
      ctx,
      "📊 Analytics Pro\n\nВыбери канал:",
      analyticsChannelSelectKeyboard(channels)
    );
  });

  bot.action(/^analytics:channel:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) {
      return showScreen(ctx, "❌ Канал не найден.", analyticsMenu());
    }

    return showScreen(
      ctx,
      buildChannelCard(row),
      channelAnalyticsKeyboard(row.channel.id)
    );
  });

  bot.action(/^analytics:growth:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) {
      return showScreen(ctx, "❌ Канал не найден.", analyticsMenu());
    }

    return showScreen(
      ctx,
      buildGrowthText(row),
      channelAnalyticsKeyboard(row.channel.id)
    );
  });

  bot.action(/^analytics:history:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) {
      return showScreen(ctx, "❌ Канал не найден.", analyticsMenu());
    }

    return showScreen(
      ctx,
      buildHistoryText(row),
      channelAnalyticsKeyboard(row.channel.id)
    );
  });

  bot.action(/^analytics:report:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const row = await getRowForCallback(ctx, Number(ctx.match[1]));

    if (!row) {
      return showScreen(ctx, "❌ Канал не найден.", analyticsMenu());
    }

    return showScreen(
      ctx,
      buildReportText(row),
      channelAnalyticsKeyboard(row.channel.id)
    );
  });

  bot.action("analytics:core", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertUser(ctx.from);
    const data = await getOwnerAnalytics(user.id);

    return showScreen(ctx, buildOwnerOverview(data), analyticsMenu());
  });

  bot.action("analytics:overview", async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertUser(ctx.from);
    const data = await getOwnerAnalytics(user.id);

    return showScreen(ctx, buildOwnerOverview(data), analyticsMenu());
  });

  bot.action(/^analytics:period:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const days = Number(ctx.match[1]);
    const data = await legacyAnalytics.period(ctx.from, days);

    return showScreen(
      ctx,
      [
        `📅 События за ${days} дней`,
        "",
        `📝 Постов: ${data.posts}`,
        `➕ Событий подписки: ${data.subscribed}`,
        `➖ Событий отписки: ${data.unsubscribed}`,
        `📊 Баланс событий: ${data.subscribed - data.unsubscribed}`,
        "",
        "Это события Telegram, а не гарантированный полный список подписчиков."
      ].join("\n"),
      analyticsMenu()
    );
  });

  bot.action("analytics:channels", async (ctx) => {
    await ctx.answerCbQuery();
    const channels = await getUserChannels(ctx.from);

    if (!channels.length) {
      return showScreen(
        ctx,
        "📢 Каналы пока не подключены.",
        mainMenu()
      );
    }

    return showScreen(
      ctx,
      "📢 Выбери канал для подробной аналитики:",
      analyticsChannelSelectKeyboard(channels)
    );
  });

  bot.action("analytics:subscribers", async (ctx) => {
    await ctx.answerCbQuery();
    const data = await legacyAnalytics.subscribersReport(ctx.from);

    const recent = data.recent.length
      ? data.recent
          .map((event) => {
            const icon =
              event.eventType === "subscribed"
                ? "➕"
                : event.eventType === "unsubscribed"
                  ? "➖"
                  : "🔄";

            const name = event.username
              ? `@${event.username}`
              : [event.firstName, event.lastName]
                  .filter(Boolean)
                  .join(" ") || event.telegramUserId;

            return `${icon} ${name}\n📢 ${event.channel.title}\n🕒 ${legacyAnalytics.formatDate(event.createdAt)}`;
          })
          .join("\n\n")
      : "Пока нет событий.";

    return showScreen(
      ctx,
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
        "Telegram не всегда отдаёт личности подписчиков. Надёжная аналитика строится на снимках общего числа."
      ].join("\n"),
      analyticsMenu()
    );
  });
}

module.exports = { registerAnalyticsHandler };
