const { mainMenu } = require("../keyboards/mainMenu");
const { channelSelectKeyboard, draftActionsKeyboard } = require("../keyboards/draftKeyboards");
const { setState, getState, clearState } = require("../storage/state");
const { getUserChannels } = require("../services/channelService");
const { createDraft, setDraftChannel, deleteDraft } = require("../services/draftService");
const { publishDraft } = require("../services/postService");

function registerDraftHandler(bot) {
  bot.action("draft:create", async (ctx) => {
    await ctx.answerCbQuery();

    setState(ctx.from.id, "WAITING_DRAFT_TEXT");

    await ctx.reply(
      [
        "📝 Создание поста",
        "",
        "Отправь текст поста одним сообщением.",
        "",
        "В v0.1 поддерживается только текст."
      ].join("\n")
    );
  });

  bot.on("text", async (ctx, next) => {
    const currentState = getState(ctx.from.id);

    if (!currentState || currentState.state !== "WAITING_DRAFT_TEXT") {
      return next();
    }

    const draft = createDraft(ctx.from, ctx.message.text);
    clearState(ctx.from.id);

    const channels = getUserChannels(ctx.from);

    if (!channels.length) {
      return ctx.reply(
        [
          "✅ Черновик сохранен.",
          "",
          "Но у тебя пока нет подключенных каналов.",
          "Сначала добавь канал."
        ].join("\n"),
        mainMenu()
      );
    }

    return ctx.reply(
      "✅ Черновик сохранен. Теперь выбери канал:",
      channelSelectKeyboard(channels, draft.id)
    );
  });

  bot.action(/^draft:select_channel:(\d+):(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    const draftId = Number(ctx.match[1]);
    const channelId = Number(ctx.match[2]);

    const draft = setDraftChannel(ctx.from, draftId, channelId);

    if (!draft) {
      return ctx.reply("❌ Черновик не найден.", mainMenu());
    }

    return ctx.reply(
      "📢 Канал выбран. Что делаем дальше?",
      draftActionsKeyboard(draft.id)
    );
  });

  bot.action(/^draft:publish:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    try {
      const result = await publishDraft(ctx, Number(ctx.match[1]));

      if (!result.ok) {
        return ctx.reply(result.message, mainMenu());
      }

      return ctx.reply(
        `✅ Пост опубликован в канал:\n\n📢 ${result.channel.title}`,
        mainMenu()
      );
    } catch (error) {
      console.error("Publish error:", error);

      return ctx.reply(
        [
          "❌ Не удалось опубликовать пост.",
          "",
          "Проверь:",
          "1. Бот добавлен администратором канала.",
          "2. У бота есть право публиковать сообщения."
        ].join("\n"),
        mainMenu()
      );
    }
  });

  bot.action(/^draft:delete:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    deleteDraft(ctx.from, Number(ctx.match[1]));

    return ctx.reply("🗑 Черновик удален.", mainMenu());
  });
}

module.exports = {
  registerDraftHandler
};
