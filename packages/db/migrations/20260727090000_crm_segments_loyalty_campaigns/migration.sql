-- CreateEnum
CREATE TYPE "CampaignTrigger" AS ENUM ('welcome', 'win_back', 'birthday', 'review_request');

-- CreateEnum
CREATE TYPE "CampaignChannel" AS ENUM ('telegram', 'sms');

-- CreateEnum
CREATE TYPE "CampaignSendStatus" AS ENUM ('pending', 'sent', 'failed', 'blocked_no_consent', 'blocked_no_channel');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "telegramChatId" TEXT;

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" "CampaignTrigger" NOT NULL,
    "channel" "CampaignChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "windowDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignSend" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "CampaignSendStatus" NOT NULL DEFAULT 'pending',
    "channel" "CampaignChannel" NOT NULL,
    "body" TEXT,
    "error" TEXT,
    "consentAtSend" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "CampaignSend_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_businessId_isActive_idx" ON "Campaign"("businessId", "isActive");

-- CreateIndex
CREATE INDEX "Campaign_trigger_idx" ON "Campaign"("trigger");

-- CreateIndex
CREATE INDEX "CampaignSend_campaignId_status_idx" ON "CampaignSend"("campaignId", "status");

-- CreateIndex
CREATE INDEX "CampaignSend_customerId_idx" ON "CampaignSend"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSend_campaignId_customerId_key" ON "CampaignSend"("campaignId", "customerId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignSend" ADD CONSTRAINT "CampaignSend_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
