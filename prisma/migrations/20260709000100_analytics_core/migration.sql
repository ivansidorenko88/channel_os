CREATE TABLE IF NOT EXISTS "AnalyticsSnapshot" (
    "id" SERIAL NOT NULL,
    "channelId" INTEGER NOT NULL,
    "subscriberCount" INTEGER NOT NULL,
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledCount" INTEGER NOT NULL DEFAULT 0,
    "draftCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'scheduler',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AnalyticsSnapshot_channelId_createdAt_idx" ON "AnalyticsSnapshot"("channelId", "createdAt");

ALTER TABLE "AnalyticsSnapshot"
ADD CONSTRAINT "AnalyticsSnapshot_channelId_fkey"
FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
