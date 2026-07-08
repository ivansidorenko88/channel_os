const { createSubscriberSnapshots } = require("../services/subscriberService");

function startSubscriberSnapshotScheduler(bot) {
  async function run() {
    try {
      await createSubscriberSnapshots(bot.telegram);
    } catch (error) {
      console.error("Subscriber snapshot scheduler error:", error);
    }
  }

  setTimeout(run, 10000);
  setInterval(run, 60 * 60 * 1000);
}

module.exports = { startSubscriberSnapshotScheduler };
