const { mainMenu } = require("../keyboards/mainMenu");
const { channelSelectKeyboard, draftActionsKeyboard } = require("../keyboards/draftKeyboards");
const { setState, getState, clearState } = require("../middleware/state");
const { getUserChannels } = require("../services/channelService");
const { createDraftFromMessage, selectDraftChannel, removeDraft } = require("../services/draftService");
const { publishDraft } = require("../services/postService");
function registerDraftHandler(bot) {
  bot.action("draft:create", async (ctx) => {
    await ctx.answerCbQuery();
    setState(ctx.from.id, "WAITING_DRAFT_CONTENT");

    await ctx.reply(
      [
        "📝 Создание поста",
        "",
        "Отправь текст, фото, видео, GIF или документ.",
        "Если отправляешь медиа — подпись тоже сохранится."
      ].join("\n")
    );
  });

  bot.on(["text", "photo", "video", "animation", "document"], async (ctx, next) => {
    const currentState = getState(ctx.from.id);
    if (!currentState || currentState.state !== "WAITING_DRAFT_CONTENT") return next();

    const draft = await createDraftFromMessage(ctx.from, ctx.message);
    clearState(ctx.from.id);

    if (!draft) return ctx.reply("❌ Этот тип сообщения пока не поддерживается.", mainMenu());

    const channels = await getUserChannels(ctx.from);
    if (!channels.length) return ctx.reply("✅ Черновик сохранен. Но сначала подключи канал.", mainMenu());

    return ctx.reply("✅ Черновик сохранен. Теперь выбери канал:", channelSelectKeyboard(channels, draft.id));
  });

  bot.action(/^draft:select_channel:(\d+):(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const draft = await selectDraftChannel(ctx.from, Number(ctx.match[1]), Number(ctx.match[2]));
    if (!draft) return ctx.reply("❌ Черновик не найден.", mainMenu());
    return ctx.reply("📢 Канал выбран. Что делаем дальше?", draftActionsKeyboard(draft.id));
  });

  bot.action(/^draft:publish:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    try {
      const result = await publishDraft(ctx, Number(ctx.match[1]));
      if (!result.ok) return ctx.reply(result.message, mainMenu());
      return ctx.reply(`✅ Пост опубликован в канал:\n\n📢 ${result.channel.title}`, mainMenu());
    } catch (error) {
      console.error("Publish error:", error);
      return ctx.reply("❌ Не удалось опубликовать. Проверь права бота в канале.", mainMenu());
    }
  });

  bot.action(/^draft:schedule:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    setState(ctx.from.id, "WAITING_SCHEDULE_TIME", { draftId: Number(ctx.match[1]) });
    return ctx.reply("📅 Отправь дату и время в формате:\n\n25.07.2026 21:30");
  });

  bot.action(/^draft:delete:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    await removeDraft(ctx.from, Number(ctx.match[1]));
    return ctx.reply("🗑 Черновик удален.", mainMenu());
  });
}

module.exports = { registerDraftHandler };
