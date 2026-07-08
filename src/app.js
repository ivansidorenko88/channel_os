const { Telegraf } = require("telegraf");
const { BOT_TOKEN } = require("./config/env");

const { registerStartHandler } = require("./handlers/startHandler");
const { registerChannelHandler } = require("./handlers/channelHandler");
const { registerDraftHandler } = require("./handlers/draftHandler");
const { registerScheduleHandler } = require("./handlers/scheduleHandler");
const { registerAnalyticsHandler } = require("./handlers/analyticsHandler");
const { registerSettingsHandler } = require("./handlers/settingsHandler");
const { startScheduler } = require("./scheduler/publisher");

const bot = new Telegraf(BOT_TOKEN);

bot.catch((error, ctx) => {
  console.error("Bot error:", error);
  if (ctx && ctx.reply) ctx.reply("❌ Произошла ошибка. Попробуй еще раз.");
});

registerStartHandler(bot);
registerChannelHandler(bot);
registerDraftHandler(bot);
registerScheduleHandler(bot);
registerAnalyticsHandler(bot);
registerSettingsHandler(bot);

startScheduler(bot);

bot.launch();

console.log("Channel OS v0.3 started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
