async function sendContent(telegram, channelTelegramId, content) {
  if (content.type === "photo") {
    return telegram.sendPhoto(channelTelegramId, content.fileId, { caption: content.caption || undefined });
  }

  if (content.type === "video") {
    return telegram.sendVideo(channelTelegramId, content.fileId, { caption: content.caption || undefined });
  }

  if (content.type === "animation") {
    return telegram.sendAnimation(channelTelegramId, content.fileId, { caption: content.caption || undefined });
  }

  if (content.type === "document") {
    return telegram.sendDocument(channelTelegramId, content.fileId, { caption: content.caption || undefined });
  }

  return telegram.sendMessage(channelTelegramId, content.text || "");
}

module.exports = { sendContent };
