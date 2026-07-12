const {
  mainMenu
} = require("../keyboards/mainMenu");
const {
  channelSelectKeyboard,
  draftListKeyboard,
  draftActionsKeyboard,
  publishConfirmKeyboard,
  deleteDraftConfirmKeyboard
} = require("../keyboards/draftKeyboards");
const {
  setState,
  getState,
  clearState
} = require("../middleware/state");
const {
  getUserChannels
} = require("../services/channelService");
const {
  createDraftFromMessage,
  selectDraftChannel,
  replaceDraftContent,
  getUserDraft,
  listUserDrafts,
  removeDraft
} = require("../services/draftService");
const {
  getSettings
} = require("../services/settingsService");
const {
  publishDraft
} = require("../services/postService");
const {
  sendContent
} = require("../services/telegramPublishService");
const {
  buildDraftCard,
  buildDraftListText
} = require("../utils/draftFormatter");

function isEditFallbackError(error) {
  const description =
    error?.response?.description ||
    error?.message ||
    "";

  return (
    description.includes("message is not modified") ||
    description.includes("message can't be edited") ||
    description.includes("message to edit not found")
  );
}

async function showScreen(ctx, text, keyboard) {
  if (ctx.callbackQuery) {
    try {
      return await ctx.editMessageText(
        text,
        keyboard
      );
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

async function renderDraftList(ctx) {
  const drafts = await listUserDrafts(
    ctx.from,
    20
  );

  return showScreen(
    ctx,
    buildDraftListText(drafts),
    draftListKeyboard(drafts)
  );
}

async function renderDraft(ctx, draftId) {
  const draft = await getUserDraft(
    ctx.from,
    draftId
  );

  if (!draft) {
    return renderDraftList(ctx);
  }

  return showScreen(
    ctx,
    buildDraftCard(draft),
    draftActionsKeyboard(draft.id)
  );
}

async function executePublish(ctx, draftId) {
  try {
    const result = await publishDraft(
      ctx,
      draftId
    );

    if (!result.ok) {
      return ctx.reply(
        result.message,
        mainMenu()
      );
    }

    return ctx.reply(
      [
        "✅ Пост опубликован",
        "",
        `📢 ${result.channel.title}`
      ].join("\n"),
      mainMenu()
    );
  } catch (error) {
    console.error("Publish error:", error);

    return ctx.reply(
      "❌ Не удалось опубликовать. Проверь права бота в канале.",
      mainMenu()
    );
  }
}

function registerDraftHandler(bot) {
  bot.command("drafts", async (ctx) => {
    return renderDraftList(ctx);
  });

  bot.action("draft:list", async (ctx) => {
    await ctx.answerCbQuery();
    return renderDraftList(ctx);
  });

  bot.action("draft:create", async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_DRAFT_CONTENT"
    );

    await ctx.reply(
      [
        "📝 Создание поста",
        "",
        "Отправь текст, фото, видео, GIF или документ.",
        "Если отправляешь медиа — подпись тоже сохранится.",
        "",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action(
    /^draft:view:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();
      return renderDraft(
        ctx,
        Number(ctx.match[1])
      );
    }
  );

  bot.action(
    /^draft:change_channel:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const draft = await getUserDraft(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!draft) {
        return renderDraftList(ctx);
      }

      const channels = await getUserChannels(
        ctx.from
      );

      if (!channels.length) {
        return ctx.reply(
          "❌ Сначала подключи канал.",
          mainMenu()
        );
      }

      return showScreen(
        ctx,
        "📢 Выбери канал для черновика:",
        channelSelectKeyboard(
          channels,
          draft.id
        )
      );
    }
  );

  bot.action(
    /^draft:select_channel:(\d+):(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const draft =
        await selectDraftChannel(
          ctx.from,
          Number(ctx.match[1]),
          Number(ctx.match[2])
        );

      if (!draft) {
        return ctx.reply(
          "❌ Черновик или канал не найден.",
          mainMenu()
        );
      }

      return showScreen(
        ctx,
        buildDraftCard(draft),
        draftActionsKeyboard(draft.id)
      );
    }
  );

  bot.action(
    /^draft:preview:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Отправляю предпросмотр");

      const draft = await getUserDraft(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!draft) {
        return renderDraftList(ctx);
      }

      await ctx.reply("👁 Предпросмотр публикации:");

      try {
        await sendContent(
          ctx.telegram,
          ctx.chat.id,
          draft
        );
      } catch (error) {
        console.error(
          "Draft preview error:",
          error
        );

        return ctx.reply(
          "❌ Не удалось показать предпросмотр."
        );
      }

      return ctx.reply(
        "Это сообщение увидят подписчики после публикации.",
        draftActionsKeyboard(draft.id)
      );
    }
  );

  bot.action(/^draft:edit:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_DRAFT_EDIT",
      {
        draftId: Number(ctx.match[1])
      }
    );

    return ctx.reply(
      [
        "✏️ Редактирование черновика",
        "",
        "Отправь новый текст или новое медиа.",
        "Текущее содержимое будет полностью заменено.",
        "",
        "Канал и рубрика сохранятся.",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action(
    /^draft:publish:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const draft = await getUserDraft(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!draft) {
        return renderDraftList(ctx);
      }

      if (!draft.channel) {
        const channels =
          await getUserChannels(ctx.from);

        if (!channels.length) {
          return ctx.reply(
            "❌ Сначала подключи канал.",
            mainMenu()
          );
        }

        return showScreen(
          ctx,
          "📢 Сначала выбери канал:",
          channelSelectKeyboard(
            channels,
            draft.id
          )
        );
      }

      const settings =
        await getSettings(ctx.from);

      if (!settings.confirmBeforePublish) {
        return executePublish(
          ctx,
          draft.id
        );
      }

      return showScreen(
        ctx,
        [
          "🚀 Опубликовать пост сейчас?",
          "",
          `📢 Канал: ${draft.channel.title}`,
          "",
          "После подтверждения пост сразу появится в канале."
        ].join("\n"),
        publishConfirmKeyboard(draft.id)
      );
    }
  );

  bot.action(
    /^draft:publish_now:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Публикую...");
      return executePublish(
        ctx,
        Number(ctx.match[1])
      );
    }
  );

  bot.action(
    /^draft:schedule:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const draft = await getUserDraft(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!draft) {
        return renderDraftList(ctx);
      }

      if (!draft.channel) {
        const channels =
          await getUserChannels(ctx.from);

        return showScreen(
          ctx,
          "📢 Сначала выбери канал:",
          channelSelectKeyboard(
            channels,
            draft.id
          )
        );
      }

      setState(
        ctx.from.id,
        "WAITING_SCHEDULE_TIME",
        {
          draftId: draft.id
        }
      );

      return ctx.reply(
        [
          "📅 Планирование публикации",
          "",
          "Отправь дату и время:",
          "25.07.2026 21:30",
          "",
          "Для отмены нажми /cancel"
        ].join("\n")
      );
    }
  );

  bot.action(
    /^draft:delete_confirm:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      return showScreen(
        ctx,
        "🗑 Точно удалить этот черновик?",
        deleteDraftConfirmKeyboard(
          Number(ctx.match[1])
        )
      );
    }
  );

  bot.action(
    /^draft:delete:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Черновик удалён");

      await removeDraft(
        ctx.from,
        Number(ctx.match[1])
      );

      return renderDraftList(ctx);
    }
  );

  bot.on(
    [
      "text",
      "photo",
      "video",
      "animation",
      "document"
    ],
    async (ctx, next) => {
      const currentState =
        getState(ctx.from.id);

      if (!currentState) return next();

      if (
        currentState.state ===
        "WAITING_DRAFT_CONTENT"
      ) {
        const draft =
          await createDraftFromMessage(
            ctx.from,
            ctx.message
          );

        clearState(ctx.from.id);

        if (!draft) {
          return ctx.reply(
            "❌ Этот тип сообщения пока не поддерживается.",
            mainMenu()
          );
        }

        const channels =
          await getUserChannels(ctx.from);

        if (!channels.length) {
          return ctx.reply(
            [
              "✅ Черновик сохранён.",
              "",
              "Канал пока не подключён. Его можно выбрать позже из списка черновиков."
            ].join("\n"),
            draftActionsKeyboard(draft.id)
          );
        }

        return ctx.reply(
          [
            "✅ Черновик сохранён.",
            "",
            "Теперь выбери канал:"
          ].join("\n"),
          channelSelectKeyboard(
            channels,
            draft.id
          )
        );
      }

      if (
        currentState.state ===
        "WAITING_DRAFT_EDIT"
      ) {
        const draft =
          await replaceDraftContent(
            ctx.from,
            currentState.payload.draftId,
            ctx.message
          );

        if (!draft) {
          return ctx.reply(
            "❌ Этот тип сообщения не поддерживается."
          );
        }

        clearState(ctx.from.id);

        return ctx.reply(
          [
            "✅ Черновик обновлён.",
            "",
            buildDraftCard(draft)
          ].join("\n"),
          draftActionsKeyboard(draft.id)
        );
      }

      return next();
    }
  );
}

module.exports = {
  registerDraftHandler
};
