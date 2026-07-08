const { execSync } = require("child_process");

function runPrismaCommand(command) {
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error);
    return false;
  }
}

function ensurePrismaClient() {
  console.log("Checking Prisma Client...");

  const generated = runPrismaCommand("npx prisma generate --schema=./prisma/schema.prisma");

  if (!generated) {
    console.error("Prisma generate failed. Bot cannot start.");
    process.exit(1);
  }

  const migrated = runPrismaCommand("npx prisma migrate deploy --schema=./prisma/schema.prisma");

  if (!migrated) {
    console.error("Prisma migrate deploy failed. Bot cannot start.");
    process.exit(1);
  }

  console.log("Prisma Client ready.");
}

ensurePrismaClient();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

module.exports = prisma;
