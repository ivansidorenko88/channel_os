require("dotenv").config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env variable: ${name}`);
  return value;
}

module.exports = {
  BOT_TOKEN: requireEnv("BOT_TOKEN"),
  ADMIN_IDS: (process.env.ADMIN_IDS || "").split(",").map((id) => id.trim()).filter(Boolean),
};
