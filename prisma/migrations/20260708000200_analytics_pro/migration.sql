CREATE TABLE IF NOT EXISTS "SubscriberEvent" (
    "id" SERIAL NOT NULL,
    "channelId" INTEGER NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "eventType" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriberEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SubscriberSnapshot" (
    "id" SERIAL NOT NULL,
    "channelId" INTEGER NOT NULL,
    "subscriberCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriberSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SubscriberEvent_channelId_eventType_createdAt_idx" ON "SubscriberEvent"("channelId", "eventType", "createdAt");
CREATE INDEX IF NOT EXISTS "SubscriberEvent_telegramUserId_idx" ON "SubscriberEvent"("telegramUserId");
CREATE INDEX IF NOT EXISTS "SubscriberSnapshot_channelId_createdAt_idx" ON "SubscriberSnapshot"("channelId", "createdAt");

ALTER TABLE "SubscriberEvent" ADD CONSTRAINT "SubscriberEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubscriberSnapshot" ADD CONSTRAINT "SubscriberSnapshot_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
