const { readDb, writeDb, nextId } = require("../storage/db");

function upsertUser(from) {
  const db = readDb();
  const telegramId = String(from.id);

  let user = db.users.find((item) => item.telegramId === telegramId);

  if (!user) {
    user = {
      id: nextId(db.users),
      telegramId,
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
  } else {
    user.username = from.username || null;
    user.firstName = from.first_name || null;
    user.lastName = from.last_name || null;
  }

  writeDb(db);
  return user;
}

module.exports = {
  upsertUser
};
