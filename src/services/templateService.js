const { upsertUser } = require("../repositories/userRepository");
const { findDraft } = require("../repositories/draftRepository");
const templateRepository = require("../repositories/templateRepository");

async function saveDraftAsTemplate(from, draftId, name) {
  const user = await upsertUser(from);
  const draft = await findDraft({
    userId: user.id,
    draftId
  });

  if (!draft) {
    return {
      ok: false,
      message: "❌ Черновик не найден."
    };
  }

  const template = await templateRepository.createTemplate({
    userId: user.id,
    name: String(name).trim().slice(0, 80),
    type: draft.type,
    text: draft.text,
    fileId: draft.fileId,
    caption: draft.caption,
    category: draft.category
  });

  return {
    ok: true,
    template
  };
}

async function listUserTemplates(from) {
  const user = await upsertUser(from);
  return templateRepository.listTemplates(user.id);
}

async function getUserTemplate(from, templateId) {
  const user = await upsertUser(from);
  return templateRepository.findTemplate(user.id, templateId);
}

async function removeUserTemplate(from, templateId) {
  const user = await upsertUser(from);
  return templateRepository.deleteTemplate(user.id, templateId);
}

module.exports = {
  saveDraftAsTemplate,
  listUserTemplates,
  getUserTemplate,
  removeUserTemplate
};
