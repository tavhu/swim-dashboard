-- ទម្រង់ទី៥ តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន.
--
-- One record per follow-up visit, plus the service rows section ២ tracks.
--
-- The manual opens with ជ្រើសរើស (២)ឬ(៣) ដើម្បីបំពេញទិន្នន័យ: a visit is one kind
-- of follow-up or the other, never both. `stage` records which was chosen, so
-- the printed form matches the paper instruction rather than leaving a reader
-- to infer it from which columns are null.

-- CreateEnum
CREATE TYPE "FollowUpStage" AS ENUM ('IN_CENTRE', 'POST_REINTEGRATION');

-- CreateTable
CREATE TABLE "followUps" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stage" "FollowUpStage" NOT NULL DEFAULT 'IN_CENTRE',
    "monitorDate" TIMESTAMP(3),
    "monitorMethod" TEXT,
    "nextMonitorDate" TIMESTAMP(3),
    "attachments" TEXT,
    "informants" TEXT,
    "monitorResult" TEXT,
    "conclusion" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followUps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followUpServices" (
    "id" TEXT NOT NULL,
    "followUpId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "outcome" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followUpServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "followUps_clientId_idx" ON "followUps"("clientId");

-- CreateIndex
CREATE INDEX "followUps_approvalStatus_idx" ON "followUps"("approvalStatus");

-- CreateIndex
CREATE INDEX "followUpServices_followUpId_sortOrder_idx" ON "followUpServices"("followUpId", "sortOrder");

-- CreateIndex
CREATE INDEX "followUpServices_serviceId_idx" ON "followUpServices"("serviceId");

-- AddForeignKey
ALTER TABLE "followUps" ADD CONSTRAINT "followUps_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followUpServices" ADD CONSTRAINT "followUpServices_followUpId_fkey" FOREIGN KEY ("followUpId") REFERENCES "followUps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followUpServices" ADD CONSTRAINT "followUpServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

