const { renderDashboard } = require("./dashboardHandler");
const {
  getOnboardingData
} = require("../services/onboardingService");
const {
  onboardingKeyboard
} = require("../keyboards/onboardingKeyboard");
const {
  buildOnboardingText
} = require("../utils/onboardingFormatter");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    const data = await getOnboardingData(ctx.from);

    if (data.shouldShow) {
      return ctx.reply(
        buildOnboardingText(data),
        onboardingKeyboard(data.progress)
      );
    }

    return renderDashboard(ctx);
  });
}

module.exports = { registerStartHandler };
