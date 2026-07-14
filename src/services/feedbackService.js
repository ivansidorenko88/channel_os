const {
  upsertUser
} = require("../repositories/userRepository");
const {
  createFeedback
} = require("../repositories/feedbackRepository");

const ALLOWED_TYPES = ["idea", "bug"];

async function saveFeedback(from, type, message) {
  const user = await upsertUser(from);
  const normalizedType =
    ALLOWED_TYPES.includes(type) ? type : "idea";
  const normalizedMessage =
    String(message || "").trim().slice(0, 4000);

  if (!normalizedMessage) return null;

  return createFeedback({
    userId: user.id,
    type: normalizedType,
    message: normalizedMessage
  });
}

module.exports = {
  saveFeedback
};
