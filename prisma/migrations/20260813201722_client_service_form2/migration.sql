-- CreateTable
CREATE TABLE "clientServices" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientTypeId" TEXT,
    "reason" TEXT,
    "usedServiceBefore" BOOLEAN NOT NULL DEFAULT false,
    "previousCenterId" TEXT,
    "totalTimes" TEXT,
    "attachments" TEXT,
    "diagnosisApprovedBy" TEXT,
    "conclusion" TEXT,
    "serviceDate" TIMESTAMP(3),
    "rehabGroupId" TEXT,
    "rehabTypeId" TEXT,
    "rehabilitationId" TEXT,
    "providerName" TEXT,
    "providerLocation" TEXT,
    "providerAgent" TEXT,
    "providerPhone" TEXT,
    "currentStatus" TEXT,
    "followUpRehabilitationId" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientServices_clientId_idx" ON "clientServices"("clientId");

-- CreateIndex
CREATE INDEX "clientServices_approvalStatus_idx" ON "clientServices"("approvalStatus");

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_clientTypeId_fkey" FOREIGN KEY ("clientTypeId") REFERENCES "clientTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_previousCenterId_fkey" FOREIGN KEY ("previousCenterId") REFERENCES "ServiceCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_rehabGroupId_fkey" FOREIGN KEY ("rehabGroupId") REFERENCES "rehabGroups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_rehabTypeId_fkey" FOREIGN KEY ("rehabTypeId") REFERENCES "rehabTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_rehabilitationId_fkey" FOREIGN KEY ("rehabilitationId") REFERENCES "rehabilitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientServices" ADD CONSTRAINT "clientServices_followUpRehabilitationId_fkey" FOREIGN KEY ("followUpRehabilitationId") REFERENCES "rehabilitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

