-- AlterTable
ALTER TABLE "EvolutionInstance" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'support';

-- CreateTable
CREATE TABLE "WizardInboxBuffer" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "contactName" TEXT,
    "conversationId" TEXT,
    "wizardSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'collecting',
    "flushAt" TIMESTAMP(3) NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WizardInboxBuffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WizardInboxMessage" (
    "id" TEXT NOT NULL,
    "bufferId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "externalMsgId" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'text',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WizardInboxMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WizardInboxBuffer_status_flushAt_idx" ON "WizardInboxBuffer"("status", "flushAt");

-- CreateIndex
CREATE INDEX "WizardInboxBuffer_instanceId_remoteJid_status_idx" ON "WizardInboxBuffer"("instanceId", "remoteJid", "status");

-- CreateIndex
CREATE INDEX "WizardInboxMessage_bufferId_idx" ON "WizardInboxMessage"("bufferId");

-- CreateIndex
CREATE INDEX "WizardSession_channel_channelRef_idx" ON "WizardSession"("channel", "channelRef");

-- AddForeignKey
ALTER TABLE "WizardInboxMessage" ADD CONSTRAINT "WizardInboxMessage_bufferId_fkey" FOREIGN KEY ("bufferId") REFERENCES "WizardInboxBuffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
