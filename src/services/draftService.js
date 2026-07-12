const {
  upsertUser
} = require("../repositories/userRepository");
const draftRepository = require("../repositories/draftRepository");

function extractDraftContent(message) {
  if (message.text) {
    return {
      type: "text",
      text: message.text
    };
  }

  if (message.photo) {
    const photo =
      message.photo[message.photo.length - 1];

    return {
      type: "photo",
      fileId: photo.file_id,
      caption: message.caption || null
    };
  }

  if (message.video) {
    return {
      type: "video",
      fileId: message.video.file_id,
      caption: message.caption || null
    };
  }

  if (message.animation) {
    return {
      type: "animation",
      fileId: message.animation.file_id,
      caption: message.caption || null
    };
  }

  if (message.document) {
    return {
      type: "document",
      fileId: message.document.file_id,
      caption: message.caption || null
    };
  }

  return null;
}

async function createDraftFromMessage(from, message) {
  const user = await upsertUser(from);
  const content = extractDraftContent(message);

  if (!content) return null;

  return draftRepository.createDraft({
    userId: user.id,
    category: user.defaultCategory || null,
    ...content
  });
}

async function createDraftFromTemplate(from, template) {
  const user = await upsertUser(from);

  return draftRepository.createDraft({
    userId: user.id,
    type: template.type,
    text: template.text,
    fileId: template.fileId,
    caption: template.caption,
    category:
      template.category ||
      user.defaultCategory ||
      null
  });
}

async function selectDraftChannel(
  from,
  draftId,
  channelId
) {
  const user = await upsertUser(from);

  return draftRepository.setDraftChannel({
    userId: user.id,
    draftId,
    channelId
  });
}

async function replaceDraftContent(
  from,
  draftId,
  message
) {
  const user = await upsertUser(from);
  const content = extractDraftContent(message);

  if (!content) return null;

  return draftRepository.updateDraftContent({
    userId: user.id,
    draftId,
    content
  });
}

async function getUserDraft(from, draftId) {
  const user = await upsertUser(from);

  return draftRepository.findDraft({
    userId: user.id,
    draftId
  });
}

async function setDraftCategory(
  from,
  draftId,
  category
) {
  const user = await upsertUser(from);

  return draftRepository.updateDraftCategory({
    userId: user.id,
    draftId,
    category
  });
}

async function listUserDrafts(from, take = 20) {
  const user = await upsertUser(from);
  return draftRepository.listDrafts(user.id, take);
}

async function removeDraft(from, draftId) {
  const user = await upsertUser(from);

  return draftRepository.deleteDraft({
    userId: user.id,
    draftId
  });
}

module.exports = {
  extractDraftContent,
  createDraftFromMessage,
  createDraftFromTemplate,
  selectDraftChannel,
  replaceDraftContent,
  getUserDraft,
  setDraftCategory,
  listUserDrafts,
  removeDraft
};
