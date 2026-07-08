const { execSync } = require("child_process");

function runPrismaStartup() {
  try {
    console.log("Running Prisma generate...");
    execSync("npx prisma generate --schema=./prisma/schema.prisma", {
      stdio: "inherit"
    });

    console.log("Running Prisma migrations...");
    execSync("npx prisma migrate deploy --schema=./prisma/schema.prisma", {
      stdio: "inherit"
    });

    console.log("Prisma startup completed");
  } catch (error) {
    console.error("Prisma startup failed:", error);
    process.exit(1);
  }
}

runPrismaStartup();

const { Telegraf } = require("telegraf");
const { BOT_TOKEN } = require("./config/env");

const { registerStartHandler } = require("./handlers/startHandler");
const { registerChannelHandler } = require("./handlers/channelHandler");
const { registerDraftHandler } = require("./handlers/draftHandler");
const { registerScheduleHandler } = require("./handlers/scheduleHandler");
const { registerAnalyticsHandler } = require("./handlers/analyticsHandler");
const { registerMemberHandler } = require("./handlers/memberHandler");
const { registerSettingsHandler } = require("./handlers/settingsHandler");
const { startPublisherScheduler } = require("./scheduler/publisher");
const { startSubscriberSnapshotScheduler } = require("./scheduler/subscriberSnapshots");

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
registerMemberHandler(bot);
registerSettingsHandler(bot);

startPublisherScheduler(bot);
startSubscriberSnapshotScheduler(bot);

bot.launch({
  allowedUpdates: [
    "message",
    "callback_query",
    "chat_member",
    "my_chat_member"
  ]
});

console.log("Channel OS v0.4.2 Analytics Pro started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
