const { upsertUser } = require("../repositories/userRepository");
const draftRepository = require("../repositories/draftRepository");

async function createTextDraft(from, text) {
  const user = await upsertUser(from);

  return draftRepository.createDraft({
    userId: user.id,
    text
  });
}

async function selectDraftChannel(from, draftId, channelId) {
  const user = await upsertUser(from);

  await draftRepository.setDraftChannel({
    userId: user.id,
    draftId,
    channelId
  });

  return draftRepository.findDraft({
    userId: user.id,
    draftId
  });
}

async function removeDraft(from, draftId) {
  const user = await upsertUser(from);

  return draftRepository.deleteDraft({
    userId: user.id,
    draftId
  });
}

module.exports = {
  createTextDraft,
  selectDraftChannel,
  removeDraft
};
