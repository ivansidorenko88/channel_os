const prisma = require("../config/prisma");

async function createFeedback(data) {
  return prisma.feedback.create({
    data,
    include: {
      user: true
    }
  });
}

async function countNewFeedback() {
  return prisma.feedback.count({
    where: { status: "new" }
  });
}

module.exports = {
  createFeedback,
  countNewFeedback
};
