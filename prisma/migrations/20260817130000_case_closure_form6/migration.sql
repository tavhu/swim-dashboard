-- ទម្រង់ទី៦ បិទករណី.
--
-- One table, no child lists and no uploads: the simplest of the six.
--
-- `outcome` records whether this was a ក.សមាហរណកម្មជោគជ័យ or a
-- ខ.សមាហរណកម្មមិនជោគជ័យ closure. The manual lists both groups without saying to
-- choose between them, but they contradict each other, so the column keeps a
-- record from holding both. That is a decision taken with the user rather than
-- something the manual states.
--
-- ៣. កំណត់សម្គាល់ has no columns. It is the manual's definition of a stable
-- reintegration, the same words on every form, so it is printed with the record
-- rather than copied into every row.

-- CreateEnum
CREATE TYPE "ClosureOutcome" AS ENUM ('SUCCESSFUL', 'UNSUCCESSFUL');

-- CreateTable
CREATE TABLE "caseClosures" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "outcome" "ClosureOutcome" NOT NULL DEFAULT 'SUCCESSFUL',
    "successReason" TEXT,
    "successReasonOther" TEXT,
    "failureReasons" TEXT,
    "centreStrengths" TEXT,
    "centreWeaknesses" TEXT,
    "centreVulnerabilities" TEXT,
    "communityStrengths" TEXT,
    "communityWeaknesses" TEXT,
    "communityVulnerabilities" TEXT,
    "futurePlan" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caseClosures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "caseClosures_clientId_idx" ON "caseClosures"("clientId");

-- CreateIndex
CREATE INDEX "caseClosures_approvalStatus_idx" ON "caseClosures"("approvalStatus");

-- AddForeignKey
ALTER TABLE "caseClosures" ADD CONSTRAINT "caseClosures_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

