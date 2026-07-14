ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "notifyOnSuccess" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "notifyOnFailure" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Draft"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS "publishingStartedAt" TIMESTAMP(3);

ALTER TABLE "Channel"
ADD COLUMN IF NOT EXISTS "lastPermissionCheckAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastPermissionOk" BOOLEAN,
ADD COLUMN IF NOT EXISTS "lastPermissionSummary" TEXT;

ALTER TABLE "ScheduledPost"
ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'idea',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx"
ON "Feedback"("status", "createdAt");

CREATE INDEX IF NOT EXISTS "Feedback_userId_createdAt_idx"
ON "Feedback"("userId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'Feedback_userId_fkey'
  ) THEN
    ALTER TABLE "Feedback"
    ADD CONSTRAINT "Feedback_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
