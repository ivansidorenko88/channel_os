const { setState, getState, clearState } = require("../middleware/state");
const {
  contentPlanKeyboard,
  contentPlanListKeyboard,
  scheduledItemKeyboard,
  recurrenceKeyboard,
  reminderKeyboard,
  cancelConfirmKeyboard,
  templateListKeyboard,
  templateActionsKeyboard
} = require("../keyboards/contentPlanKeyboards");
const {
  channelSelectKeyboard,
  draftActionsKeyboard
} = require("../keyboards/draftKeyboards");
const {
  getContentPlanSummary,
  listContentPlan
} = require("../services/contentPlanService");
const {
  parseDateTimeRu,
  getScheduledForUser,
  rescheduleForUser,
  updateScheduledContent,
  setScheduledRecurrence,
  setScheduledReminder,
  setScheduledCategory,
  queueScheduledNow,
  retryScheduledForUser,
  cancelScheduledForUser
} = require("../services/scheduleService");
const {
  setDraftCategory,
  createDraftFromTemplate
} = require("../services/draftService");
const {
  saveDraftAsTemplate,
  listUserTemplates,
  getUserTemplate,
  removeUserTemplate
} = require("../services/templateService");
const { getUserChannels } = require("../services/channelService");
const {
  buildContentPlanText,
  buildPlanListText,
  buildScheduledItemText,
  buildTemplateText
} = require("../utils/contentPlanFormatter");
const {
  processScheduledPostNow
} = require("../scheduler/publisher");

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

async function showScreen(ctx, text, keyboard, edit = true) {
  if (ctx.callbackQuery && edit) {
    try {
      return await ctx.editMessageText(text, keyboard);
    } catch (error) {
      if (!isEditFallbackError(error)) throw error;
    }
  }

  return ctx.reply(text, keyboard);
}

async function renderMain(ctx, edit = true) {
  const summary = await getContentPlanSummary(ctx.from);

  return showScreen(
    ctx,
    buildContentPlanText(summary),
    contentPlanKeyboard(),
    edit
  );
}

async function renderItem(ctx, scheduledId, edit = true) {
  const item = await getScheduledForUser(
    ctx.from,
    scheduledId
  );

  if (!item) {
    return showScreen(
      ctx,
      "❌ Публикация не найдена.",
      contentPlanKeyboard(),
      edit
    );
  }

  return showScreen(
    ctx,
    buildScheduledItemText(item),
    scheduledItemKeyboard(item),
    edit
  );
}

async function renderTemplates(ctx, edit = true) {
  const templates = await listUserTemplates(ctx.from);

  if (!templates.length) {
    return showScreen(
      ctx,
      [
        "🧩 Шаблоны",
        "",
        "Шаблонов пока нет.",
        "",
        "Создай черновик и нажми «🧩 В шаблоны»."
      ].join("\n"),
      templateListKeyboard([]),
      edit
    );
  }

  return showScreen(
    ctx,
    `🧩 Шаблоны\n\nСохранено: ${templates.length}`,
    templateListKeyboard(templates),
    edit
  );
}

function registerContentPlanHandler(bot) {
  bot.command("plan", async (ctx) => {
    return renderMain(ctx, false);
  });

  bot.command("content_plan", async (ctx) => {
    return renderMain(ctx, false);
  });

  bot.action("contentplan:main", async (ctx) => {
    await ctx.answerCbQuery();
    return renderMain(ctx);
  });

  bot.action(
    /^contentplan:list:(today|week|all|recurring|failed)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const range = ctx.match[1];
      let items = await listContentPlan(
        ctx.from,
        range === "recurring" ? "all" : range
      );

      if (range === "recurring") {
        items = items.filter(
          (item) => item.recurrence !== "none"
        );
      }

      const titles = {
        today: "📍 Публикации на сегодня",
        week: "🗓 Публикации на 7 дней",
        all: "📚 Вся очередь публикаций",
        recurring: "🔁 Повторяющиеся публикации",
        failed: "❌ Ошибки публикации"
      };

      return showScreen(
        ctx,
        buildPlanListText(items, titles[range]),
        contentPlanListKeyboard(items, range)
      );
    }
  );

  bot.action(/^contentplan:item:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    return renderItem(ctx, Number(ctx.match[1]));
  });

bot.action(
  /^contentplan:publish_now:(\d+)$/,
  async (ctx) => {
    await ctx.answerCbQuery("Публикую...");

    const queued = await queueScheduledNow(
      ctx.from,
      Number(ctx.match[1])
    );

    if (!queued) {
      return ctx.reply("❌ Публикация не найдена.");
    }

    const result = await processScheduledPostNow(
      ctx.telegram,
      queued.id
    );

    if (!result.ok) {
      return ctx.reply(
        result.reason ||
        "❌ Публикация завершилась ошибкой. Открой раздел «Ошибки публикации»."
      );
    }

    return ctx.reply(
      `✅ Пост опубликован в канале «${result.item.channel.title}».`,
      contentPlanKeyboard()
    );
  }
);

bot.action(
  /^contentplan:retry:(\d+)$/,
  async (ctx) => {
    await ctx.answerCbQuery("Повторяю отправку...");

    const queued = await retryScheduledForUser(
      ctx.from,
      Number(ctx.match[1])
    );

    if (!queued) {
      return ctx.reply(
        "❌ Не удалось повторить: публикация не найдена или больше не находится в статусе ошибки."
      );
    }

    const result = await processScheduledPostNow(
      ctx.telegram,
      queued.id
    );

    if (!result.ok) {
      return ctx.reply(
        "❌ Повторная отправка не удалась. Причина сохранена в карточке публикации."
      );
    }

    return ctx.reply(
      `✅ Повторная отправка выполнена: ${result.item.channel.title}.`,
      contentPlanKeyboard()
    );
  }
);

  bot.action(
    /^contentplan:reschedule:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      setState(
        ctx.from.id,
        "WAITING_CONTENT_PLAN_RESCHEDULE",
        { scheduledId: Number(ctx.match[1]) }
      );

      return ctx.reply(
        [
          "🕒 Перенос публикации",
          "",
          "Отправь новую дату и время:",
          "",
          "25.07.2026 21:30",
          "",
          "Для отмены нажми /cancel"
        ].join("\n")
      );
    }
  );

  bot.action(/^contentplan:edit:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_CONTENT_PLAN_EDIT",
      { scheduledId: Number(ctx.match[1]) }
    );

    return ctx.reply(
      [
        "✏️ Изменение публикации",
        "",
        "Отправь новый текст или новое медиа.",
        "Текущее содержимое будет заменено.",
        "",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action(/^contentplan:repeat:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    return showScreen(
      ctx,
      "🔁 Как часто повторять публикацию?",
      recurrenceKeyboard(Number(ctx.match[1]))
    );
  });

  bot.action(
    /^contentplan:set_repeat:(\d+):(none|daily|weekly|monthly)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Повтор обновлён");

      const item = await setScheduledRecurrence(
        ctx.from,
        Number(ctx.match[1]),
        ctx.match[2]
      );

      if (!item) {
        return ctx.reply("❌ Публикация не найдена.");
      }

      return renderItem(ctx, item.id);
    }
  );

  bot.action(
    /^contentplan:reminder:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      return showScreen(
        ctx,
        "🔔 Когда напомнить о публикации?",
        reminderKeyboard(Number(ctx.match[1]))
      );
    }
  );

  bot.action(
    /^contentplan:set_reminder:(\d+):(0|15|30|60)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Напоминание обновлено");

      const item = await setScheduledReminder(
        ctx.from,
        Number(ctx.match[1]),
        Number(ctx.match[2])
      );

      if (!item) {
        return ctx.reply("❌ Публикация не найдена.");
      }

      return renderItem(ctx, item.id);
    }
  );

  bot.action(
    /^contentplan:category:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      setState(
        ctx.from.id,
        "WAITING_CONTENT_PLAN_CATEGORY",
        { scheduledId: Number(ctx.match[1]) }
      );

      return ctx.reply(
        [
          "🏷 Рубрика публикации",
          "",
          "Отправь название, например:",
          "Новости",
          "Обновления",
          "Полезное",
          "",
          "Для отмены нажми /cancel"
        ].join("\n")
      );
    }
  );

  bot.action(
    /^contentplan:cancel_confirm:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      return showScreen(
        ctx,
        "🗑 Точно отменить эту публикацию?",
        cancelConfirmKeyboard(Number(ctx.match[1]))
      );
    }
  );

  bot.action(/^contentplan:cancel:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery("Публикация отменена");

    const item = await cancelScheduledForUser(
      ctx.from,
      Number(ctx.match[1])
    );

    if (!item) {
      return ctx.reply("❌ Публикация не найдена.");
    }

    return renderMain(ctx);
  });

  bot.action(/^draft:category:(\d+)$/, async (ctx) => {
    await ctx.answerCbQuery();

    setState(
      ctx.from.id,
      "WAITING_DRAFT_CATEGORY",
      { draftId: Number(ctx.match[1]) }
    );

    return ctx.reply(
      [
        "🏷 Рубрика черновика",
        "",
        "Отправь название рубрики.",
        "Для отмены нажми /cancel"
      ].join("\n")
    );
  });

  bot.action(
    /^draft:save_template:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      setState(
        ctx.from.id,
        "WAITING_TEMPLATE_NAME",
        { draftId: Number(ctx.match[1]) }
      );

      return ctx.reply(
        [
          "🧩 Сохранение шаблона",
          "",
          "Отправь название шаблона.",
          "Например: Еженедельный отчёт",
          "",
          "Для отмены нажми /cancel"
        ].join("\n")
      );
    }
  );

  bot.action("contentplan:templates", async (ctx) => {
    await ctx.answerCbQuery();
    return renderTemplates(ctx);
  });

  bot.action(
    /^contentplan:template:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const template = await getUserTemplate(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!template) {
        return renderTemplates(ctx);
      }

      return showScreen(
        ctx,
        buildTemplateText(template),
        templateActionsKeyboard(template.id)
      );
    }
  );

  bot.action(
    /^contentplan:template_use:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery();

      const template = await getUserTemplate(
        ctx.from,
        Number(ctx.match[1])
      );

      if (!template) {
        return ctx.reply("❌ Шаблон не найден.");
      }

      const draft = await createDraftFromTemplate(
        ctx.from,
        template
      );

      const channels = await getUserChannels(ctx.from);

      if (!channels.length) {
        return ctx.reply(
          "✅ Черновик создан. Сначала подключи канал."
        );
      }

      return ctx.reply(
        "✅ Черновик создан из шаблона. Выбери канал:",
        channelSelectKeyboard(channels, draft.id)
      );
    }
  );

  bot.action(
    /^contentplan:template_delete:(\d+)$/,
    async (ctx) => {
      await ctx.answerCbQuery("Шаблон удалён");

      await removeUserTemplate(
        ctx.from,
        Number(ctx.match[1])
      );

      return renderTemplates(ctx);
    }
  );

  bot.command("cancel", async (ctx) => {
    const currentState = getState(ctx.from.id);

    if (!currentState) {
      return ctx.reply("Нет активного действия для отмены.");
    }

    clearState(ctx.from.id);
    return ctx.reply("✅ Действие отменено.");
  });

  bot.on(
    ["text", "photo", "video", "animation", "document"],
    async (ctx, next) => {
      const currentState = getState(ctx.from.id);

      if (!currentState) return next();

      if (
        currentState.state ===
        "WAITING_CONTENT_PLAN_RESCHEDULE"
      ) {
        if (!ctx.message.text) {
          return ctx.reply(
            "❌ Отправь дату текстом: 25.07.2026 21:30"
          );
        }

        const date = parseDateTimeRu(ctx.message.text);

        if (!date) {
          return ctx.reply(
            "❌ Неверный формат или дата уже прошла. Пример: 25.07.2026 21:30"
          );
        }

        const item = await rescheduleForUser(
          ctx.from,
          currentState.payload.scheduledId,
          date
        );

        clearState(ctx.from.id);

        if (!item) {
          return ctx.reply("❌ Публикация не найдена.");
        }

        return ctx.reply(
          "✅ Публикация перенесена.",
          scheduledItemKeyboard(item)
        );
      }

      if (
        currentState.state ===
        "WAITING_CONTENT_PLAN_EDIT"
      ) {
        const item = await updateScheduledContent(
          ctx.from,
          currentState.payload.scheduledId,
          ctx.message
        );

        if (!item) {
          return ctx.reply(
            "❌ Этот тип сообщения не поддерживается."
          );
        }

        clearState(ctx.from.id);

        return ctx.reply(
          "✅ Содержимое публикации обновлено.",
          scheduledItemKeyboard(item)
        );
      }

      if (
        currentState.state ===
        "WAITING_CONTENT_PLAN_CATEGORY"
      ) {
        if (!ctx.message.text) {
          return ctx.reply("❌ Отправь название рубрики текстом.");
        }

        const item = await setScheduledCategory(
          ctx.from,
          currentState.payload.scheduledId,
          ctx.message.text
        );

        clearState(ctx.from.id);

        if (!item) {
          return ctx.reply("❌ Публикация не найдена.");
        }

        return ctx.reply(
          "✅ Рубрика сохранена.",
          scheduledItemKeyboard(item)
        );
      }

      if (currentState.state === "WAITING_DRAFT_CATEGORY") {
        if (!ctx.message.text) {
          return ctx.reply("❌ Отправь название рубрики текстом.");
        }

        const draft = await setDraftCategory(
          ctx.from,
          currentState.payload.draftId,
          ctx.message.text.trim().slice(0, 60)
        );

        clearState(ctx.from.id);

        if (!draft) {
          return ctx.reply("❌ Черновик не найден.");
        }

        return ctx.reply(
          `✅ Рубрика сохранена: ${draft.category}`,
          draftActionsKeyboard(draft.id)
        );
      }

      if (currentState.state === "WAITING_TEMPLATE_NAME") {
        if (!ctx.message.text) {
          return ctx.reply("❌ Отправь название шаблона текстом.");
        }

        const result = await saveDraftAsTemplate(
          ctx.from,
          currentState.payload.draftId,
          ctx.message.text
        );

        clearState(ctx.from.id);

        if (!result.ok) {
          return ctx.reply(result.message);
        }

        return ctx.reply(
          `✅ Шаблон «${result.template.name}» сохранён.`,
          draftActionsKeyboard(
            currentState.payload.draftId
          )
        );
      }

      return next();
    }
  );
}

module.exports = {
  registerContentPlanHandler
};
