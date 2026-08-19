-- ការបញ្ជូន — referrals, and the list behind their service-type dropdown.
--
-- referralServiceTypes is its own table rather than a reuse of services: a
-- referral asks what kind of help is being sought, which is a shorter and
-- differently-shaped list than the catalogue of services a centre delivers, and
-- the two are maintained by different people.
--
-- referrals sit outside the ទម្រង់ទី១-៦ pipeline on purpose. That sequence is the
-- case file the manual defines and the order rule enforces; a referral can be
-- raised at any point, and gating it behind a form the client has not reached
-- would block the very thing it exists for. It carries the same approval block
-- as the six so the one shared panel and helper serve it too.

-- CreateEnum
CREATE TYPE "ReferralUrgency" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

-- AlterEnum
ALTER TYPE "ApprovalRecordType" ADD VALUE 'REFERRAL';

-- CreateTable
CREATE TABLE "referralServiceTypes" (
    "id" TEXT NOT NULL,
    "nameKh" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referralServiceTypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "serviceTypeId" TEXT,
    "primaryReason" TEXT,
    "currentSituation" TEXT,
    "urgency" "ReferralUrgency" NOT NULL DEFAULT 'ROUTINE',
    "consentObtained" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT,
    "signature" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "referrals_clientId_idx" ON "referrals"("clientId");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_serviceTypeId_fkey" FOREIGN KEY ("serviceTypeId") REFERENCES "referralServiceTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
