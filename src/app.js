const { Telegraf } = require("telegraf");
const { BOT_TOKEN } = require("./config/env");
const { isExpiredCallbackError } = require("./utils/safeCallback");
const { callbackSafety } = require("./middleware/callbackSafety");

const { registerStartHandler } = require("./handlers/startHandler");
const { registerDashboardHandler } = require("./handlers/dashboardHandler");
const { registerChannelHandler } = require("./handlers/channelHandler");
const { registerDraftHandler } = require("./handlers/draftHandler");
const { registerScheduleHandler } = require("./handlers/scheduleHandler");
const { registerAnalyticsHandler } = require("./handlers/analyticsHandler");
const { registerMemberHandler } = require("./handlers/memberHandler");
const { registerSettingsHandler } = require("./handlers/settingsHandler");
const { registerDebugHandler } = require("./handlers/debugHandler");
const { registerAdminHandler } = require("./handlers/adminHandler");
const { startPublisherScheduler } = require("./scheduler/publisher");
const { startSubscriberSnapshotScheduler } = require("./scheduler/subscriberSnapshots");
const { startAnalyticsCoreScheduler } = require("./scheduler/analyticsCoreScheduler");

const bot = new Telegraf(BOT_TOKEN);

bot.use(callbackSafety);

bot.catch((error, ctx) => {
  if (isExpiredCallbackError(error)) {
    const callbackId = ctx?.callbackQuery?.id || "unknown";
    console.warn(`[Callback] Globally ignored expired callback query: ${callbackId}`);
    return;
  }

  console.error("Bot error:", error);

  if (ctx && ctx.reply) {
    ctx.reply("❌ Произошла ошибка. Попробуй еще раз.").catch(() => {});
  }
});

registerDashboardHandler(bot);
registerStartHandler(bot);
registerChannelHandler(bot);
registerDraftHandler(bot);
registerScheduleHandler(bot);
registerAnalyticsHandler(bot);
registerMemberHandler(bot);
registerSettingsHandler(bot);
registerDebugHandler(bot);
registerAdminHandler(bot);

startPublisherScheduler(bot);
startSubscriberSnapshotScheduler(bot);
startAnalyticsCoreScheduler(bot);

bot.launch({
  allowedUpdates: [
    "message",
    "callback_query",
    "chat_member",
    "my_chat_member"
  ]
});

console.log("Channel OS v0.3.2 Admin Statistics started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
