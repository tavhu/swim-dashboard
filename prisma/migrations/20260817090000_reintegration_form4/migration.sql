-- ទម្រង់ទី៤ សមាហរណកម្ម.
--
-- Three tables: the record, and its two repeating lists —
-- ២. សេវាកម្មដែលបានទទួលកន្លងមក (already delivered, each with an outcome) and
-- ៤. សេវាកម្មនៅសហគមន៍ត្រូវផ្តល់បន្ត (to continue in the community, no outcome
-- because they have not happened yet). Both cascade with the record.
--
-- Section ១ is not stored: Client_PersonalInformation already holds it and it
-- is read through the relation, as ទម្រង់ទី៣ does.

-- CreateTable
CREATE TABLE "reintegrations" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "consultation" TEXT,
    "handoverDate" TIMESTAMP(3),
    "recipient" TEXT,
    "recipientPhone1" TEXT,
    "recipientPhone2" TEXT,
    "communeChiefName" TEXT,
    "communeChiefSex" TEXT,
    "communeChiefAge" INTEGER,
    "communeChiefPhone" TEXT,
    "villageChiefName" TEXT,
    "villageChiefSex" TEXT,
    "villageChiefAge" INTEGER,
    "villageChiefPhone" TEXT,
    "localOrganisation" TEXT,
    "goalAttachments" TEXT,
    "communityAttachments" TEXT,
    "monitorDate" TIMESTAMP(3),
    "informants" TEXT,
    "monitorMethod" TEXT,
    "monitorResult" TEXT,
    "nextMonitorDate" TIMESTAMP(3),
    "conclusion" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reintegrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reintegrationPastServices" (
    "id" TEXT NOT NULL,
    "reintegrationId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "outcome" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reintegrationPastServices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reintegrationCommunityServices" (
    "id" TEXT NOT NULL,
    "reintegrationId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reintegrationCommunityServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reintegrations_clientId_idx" ON "reintegrations"("clientId");

-- CreateIndex
CREATE INDEX "reintegrations_approvalStatus_idx" ON "reintegrations"("approvalStatus");

-- CreateIndex
CREATE INDEX "reintegrationPastServices_reintegrationId_sortOrder_idx" ON "reintegrationPastServices"("reintegrationId", "sortOrder");

-- CreateIndex
CREATE INDEX "reintegrationPastServices_serviceId_idx" ON "reintegrationPastServices"("serviceId");

-- CreateIndex
CREATE INDEX "reintegrationCommunityServices_reintegrationId_sortOrder_idx" ON "reintegrationCommunityServices"("reintegrationId", "sortOrder");

-- CreateIndex
CREATE INDEX "reintegrationCommunityServices_serviceId_idx" ON "reintegrationCommunityServices"("serviceId");

-- AddForeignKey
ALTER TABLE "reintegrations" ADD CONSTRAINT "reintegrations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reintegrationPastServices" ADD CONSTRAINT "reintegrationPastServices_reintegrationId_fkey" FOREIGN KEY ("reintegrationId") REFERENCES "reintegrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reintegrationPastServices" ADD CONSTRAINT "reintegrationPastServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reintegrationCommunityServices" ADD CONSTRAINT "reintegrationCommunityServices_reintegrationId_fkey" FOREIGN KEY ("reintegrationId") REFERENCES "reintegrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reintegrationCommunityServices" ADD CONSTRAINT "reintegrationCommunityServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

