const { renderDashboard } = require("./dashboardHandler");

function registerStartHandler(bot) {
  bot.start(async (ctx) => {
    return renderDashboard(ctx);
  });
}

module.exports = { registerStartHandler };
