-- ខ. សេវាបញ្ចូនបន្ត on ទម្រង់ទី៣ becomes a full onward referral per entry, and
-- the standalone referral form is folded into it — so referrals are recorded in
-- one place. The standalone `referrals` table is dropped (it was new and empty);
-- ReferralServiceType (the Referral & Service Details lookup) stays.

-- Expand the ខ. rows with the referral detail the standalone form carried.
ALTER TABLE "casePlanReferralServices"
  ADD COLUMN "primaryReason" TEXT,
  ADD COLUMN "currentSituation" TEXT,
  ADD COLUMN "urgency" "ReferralUrgency" NOT NULL DEFAULT 'ROUTINE',
  ADD COLUMN "consentObtained" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "attachments" TEXT,
  ADD COLUMN "signature" TEXT;

-- Drop the standalone referral table.
DROP TABLE IF EXISTS "referrals";

-- The ApprovalRecordType enum keeps its now-unused REFERRAL value: Postgres
-- cannot drop an enum value without recreating the type, and an unused value is
-- harmless. Referrals under a case plan are approved with the plan, not on their
-- own, so nothing files audit rows under REFERRAL any more.
