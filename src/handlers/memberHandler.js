const { handleChatMemberUpdate } = require("../services/subscriberService");

function registerMemberHandler(bot) {
  bot.on("chat_member", async (ctx) => {
    try {
      await handleChatMemberUpdate(ctx);
    } catch (error) {
      console.error("chat_member handler error:", error);
    }
  });
}

module.exports = { registerMemberHandler };
