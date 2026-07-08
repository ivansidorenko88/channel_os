const { findChannelByTelegramId, listAllChannels } = require("../repositories/channelRepository");
const { createSubscriberEvent, createSnapshot } = require("../repositories/subscriberRepository");

function normalizeEventType(oldStatus, newStatus) {
  const inactive = ["left", "kicked"];
  const active = ["member", "administrator", "creator"];

  if (inactive.includes(oldStatus) && active.includes(newStatus)) return "subscribed";
  if (active.includes(oldStatus) && inactive.includes(newStatus)) return "unsubscribed";

  return "status_changed";
}

async function handleChatMemberUpdate(ctx) {
  const update = ctx.update.chat_member;
  if (!update || !update.chat || update.chat.type !== "channel") return;

  const channel = await findChannelByTelegramId(String(update.chat.id));
  if (!channel) return;

  const user = update.new_chat_member.user;
  const oldStatus = update.old_chat_member.status;
  const newStatus = update.new_chat_member.status;
  const eventType = normalizeEventType(oldStatus, newStatus);

  await createSubscriberEvent({
    channelId: channel.id,
    telegramUserId: String(user.id),
    username: user.username || null,
    firstName: user.first_name || null,
    lastName: user.last_name || null,
    eventType,
    oldStatus,
    newStatus
  });
}

async function createSubscriberSnapshots(telegram) {
  const channels = await listAllChannels();

  for (const channel of channels) {
    try {
      const count = await telegram.getChatMemberCount(channel.telegramId);
      await createSnapshot({
        channelId: channel.id,
        subscriberCount: count
      });
    } catch (error) {
      console.error(`Snapshot failed for channel ${channel.id}:`, error.message);
    }
  }
}

module.exports = { handleChatMemberUpdate, createSubscriberSnapshots };
