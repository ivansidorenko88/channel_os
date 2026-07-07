const { mainMenu } = require("../keyboards/mainMenu");
const { channelSelectKeyboard, draftActionsKeyboard } = require("../keyboards/channelKeyboards");
const { setState, getState, clearState } = require("../middleware/sessionState");
const { upsertFromTelegramUser } = require("../repositories/userRepository");
const { listUserChannels } = require("../repositories/channelRepository");
const { setDraftChannel, findDraftForUser, deleteDraft } = require("../repositories/draftRepository");
const { saveTextDraft, publishDraft } = require("../services/postService");
function registerDraftHandler(bot) {
  bot.action("draft:create", async (ctx) => {
    await ctx.answerCbQuery();
    setState(ctx.from.id, "WAITING_DRAFT_TEXT");
    await ctx.reply(["📝 Создание поста", "", "Отправь текст будущего поста одним сообщением.", "", "В v0.1 поддерживается только текст. Медиа добавим в v0.2."].join("\n"));
  });
  bot.on("text", async (ctx, next) => {
    const state = getState(ctx.from.id);
    if (state !== "WAITING_DRAFT_TEXT") return next();
    const draft = await saveTextDraft(ctx);
    clearState(ctx.from.id);
    const user = await upsertFromTelegramUser(ctx.from);
    const channels = await listUserChannels(user.id);
    if (!channels.length) return ctx.reply(["✅ Черновик сохранен.", "", "Но у тебя пока нет подключенных каналов.", "Сначала добавь канал, потом сможешь публиковать."].join("\n"), mainMenu());
    return ctx.reply("✅ Черновик сохранен.\n\nТеперь выбери канал для публикации:", channelSelectKeyboard(channels, draft.id));
  });
  bot.action(/^draft:select_channel:(\d+):(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const draftId = Number(ctx.match[1]);
    const channelId = Number(ctx.match[2]);
    const user = await upsertFromTelegramUser(ctx.from);
    await setDraftChannel({ draftId, userId: user.id, channelId });
    const draft = await findDraftForUser(draftId, user.id);
    if (!draft || !draft.channel) return ctx.reply("❌ Не удалось выбрать канал.", mainMenu());
    return ctx.reply(`📢 Канал выбран: ${draft.channel.title}\n\nЧто делаем дальше?`, draftActionsKeyboard(draft.id));
  });
  bot.action(/^draft:publish:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const result = await publishDraft(ctx, Number(ctx.match[1]));
      if (!result.ok) return ctx.reply(result.message, mainMenu());
      return ctx.reply(`✅ Пост опубликован в канал:\n\n📢 ${result.channel.title}`, mainMenu());
    } catch (error) {
      console.error(error);
      return ctx.reply(["❌ Не удалось опубликовать пост.", "", "Проверь:", "1. Бот добавлен администратором канала.", "2. У бота есть право публиковать сообщения.", "3. Канал не удален и бот не заблокирован."].join("\n"), mainMenu());
    }
  });
  bot.action(/^draft:delete:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const user = await upsertFromTelegramUser(ctx.from);
    await deleteDraft(Number(ctx.match[1]), user.id);
    return ctx.reply("🗑 Черновик удален.", mainMenu());
  });
}
module.exports = { registerDraftHandler };
