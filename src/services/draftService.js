const { readDb, writeDb, nextId } = require("../storage/db");
const { upsertUser } = require("./userService");

function createDraft(from, text) {
  const user = upsertUser(from);
  const db = readDb();

  const draft = {
    id: nextId(db.drafts),
    userId: user.id,
    channelId: null,
    text,
    createdAt: new Date().toISOString()
  };

  db.drafts.push(draft);
  writeDb(db);

  return draft;
}

function setDraftChannel(from, draftId, channelId) {
  const user = upsertUser(from);
  const db = readDb();

  const draft = db.drafts.find(
    (item) =>
      item.id === Number(draftId) &&
      item.userId === user.id
  );

  if (!draft) return null;

  draft.channelId = Number(channelId);
  writeDb(db);

  return draft;
}

function getDraft(from, draftId) {
  const user = upsertUser(from);
  const db = readDb();

  return db.drafts.find(
    (item) =>
      item.id === Number(draftId) &&
      item.userId === user.id
  );
}

function deleteDraft(from, draftId) {
  const user = upsertUser(from);
  const db = readDb();

  const before = db.drafts.length;

  db.drafts = db.drafts.filter(
    (item) =>
      !(
        item.id === Number(draftId) &&
        item.userId === user.id
      )
  );

  writeDb(db);

  return before !== db.drafts.length;
}

module.exports = {
  createDraft,
  setDraftChannel,
  getDraft,
  deleteDraft
};
