const { findDuePosts, markPublished, markFailed } = require("../repositories/scheduledPostRepository");
const { createPublishedPost } = require("../repositories/postRepository");
const { sendContent } = require("../services/telegramPublishService");

function startPublisherScheduler(bot) {
  setInterval(async () => {
    try {
      const duePosts = await findDuePosts();

      for (const item of duePosts) {
        try {
          const sent = await sendContent(bot.telegram, item.channel.telegramId, item);

          await createPublishedPost({
            channelId: item.channel.id,
            telegramMessageId: sent.message_id,
            type: item.type,
            text: item.text,
            fileId: item.fileId,
            caption: item.caption
          });

          await markPublished(item.id);
          console.log(`Scheduled post ${item.id} published`);
        } catch (error) {
          console.error(`Scheduled post ${item.id} failed:`, error);
          await markFailed(item.id);
        }
      }
    } catch (error) {
      console.error("Publisher scheduler loop error:", error);
    }
  }, 30000);
}

module.exports = { startPublisherScheduler };
