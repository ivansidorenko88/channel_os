const prisma = require("../config/prisma");

async function createTemplate(data) {
  return prisma.contentTemplate.create({ data });
}

async function listTemplates(userId, take = 20) {
  return prisma.contentTemplate.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take
  });
}

async function findTemplate(userId, templateId) {
  return prisma.contentTemplate.findFirst({
    where: {
      id: Number(templateId),
      userId
    }
  });
}

async function deleteTemplate(userId, templateId) {
  return prisma.contentTemplate.deleteMany({
    where: {
      id: Number(templateId),
      userId
    }
  });
}

async function countTemplates(userId) {
  return prisma.contentTemplate.count({
    where: { userId }
  });
}

module.exports = {
  createTemplate,
  listTemplates,
  findTemplate,
  deleteTemplate,
  countTemplates
};
