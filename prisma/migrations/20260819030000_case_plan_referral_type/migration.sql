-- ខ. សេវាបញ្ចូនបន្ត now names a referral service type from the Referral & Service
-- Details table, not a catalogue service. The two are different lists kept by
-- different people: what a centre delivers vs what a client is referred onward
-- to. The table is new and empty, so the column is swapped rather than migrated.

ALTER TABLE "casePlanReferralServices" DROP CONSTRAINT IF EXISTS "casePlanReferralServices_serviceId_fkey";
DROP INDEX IF EXISTS "casePlanReferralServices_serviceId_idx";
ALTER TABLE "casePlanReferralServices" DROP COLUMN IF EXISTS "serviceId";

ALTER TABLE "casePlanReferralServices" ADD COLUMN "referralTypeId" TEXT;
CREATE INDEX "casePlanReferralServices_referralTypeId_idx" ON "casePlanReferralServices"("referralTypeId");
ALTER TABLE "casePlanReferralServices"
  ADD CONSTRAINT "casePlanReferralServices_referralTypeId_fkey"
  FOREIGN KEY ("referralTypeId") REFERENCES "referralServiceTypes"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
