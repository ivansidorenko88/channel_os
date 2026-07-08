const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(process.cwd(), "data", "db.json");

const defaultDb = {
  users: [],
  channels: [],
  drafts: [],
  posts: []
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDb();

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      channels: Array.isArray(parsed.channels) ? parsed.channels : [],
      drafts: Array.isArray(parsed.drafts) ? parsed.drafts : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : []
    };
  } catch (error) {
    console.error("DB read error:", error);
    return { ...defaultDb };
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

function nextId(items) {
  if (!items.length) return 1;
  return Math.max(...items.map((item) => Number(item.id) || 0)) + 1;
}

module.exports = {
  readDb,
  writeDb,
  nextId
};
