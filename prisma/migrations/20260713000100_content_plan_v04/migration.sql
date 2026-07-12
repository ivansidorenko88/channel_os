ALTER TABLE "Draft"
ADD COLUMN IF NOT EXISTS "category" TEXT;

ALTER TABLE "Post"
ADD COLUMN IF NOT EXISTS "category" TEXT;

ALTER TABLE "ScheduledPost"
ADD COLUMN IF NOT EXISTS "category" TEXT,
ADD COLUMN IF NOT EXISTS "recurrence" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS "recurrenceUntil" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reminderMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "failureReason" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "ScheduledPost_channelId_status_scheduledAt_idx"
ON "ScheduledPost"("channelId", "status", "scheduledAt");

CREATE TABLE IF NOT EXISTS "ContentTemplate" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "text" TEXT,
    "fileId" TEXT,
    "caption" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ContentTemplate_userId_updatedAt_idx"
ON "ContentTemplate"("userId", "updatedAt");

ALTER TABLE "ContentTemplate"
ADD CONSTRAINT "ContentTemplate_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
