-- governStaff child tables: delete cascades
--
-- Every repeatable list on the បុគ្គលិករដ្ឋ form pointed back at governStaff
-- with the default (NO ACTION) foreign key. There is no delete endpoint today,
-- so nothing in the app trips this — but any direct removal of a staff row
-- would be refused, or worse, leave eleven kinds of orphaned rows behind.
-- Forms ១–៥'s child tables already cascade; this brings the staff lists in
-- line with them.

ALTER TABLE "governStaffChildren" DROP CONSTRAINT IF EXISTS "governStaffChildren_governStaffID_fkey";
ALTER TABLE "governStaffQualifitcation" DROP CONSTRAINT IF EXISTS "governStaffQualifitcation_governStaffID_fkey";
ALTER TABLE "governStaffLanuage" DROP CONSTRAINT IF EXISTS "governStaffLanuage_governStaffID_fkey";
ALTER TABLE "governStaffWorkingHistoryPublic" DROP CONSTRAINT IF EXISTS "governStaffWorkingHistoryPublic_governStaffID_fkey";
ALTER TABLE "governStaffWorkingHistoryPrivate" DROP CONSTRAINT IF EXISTS "governStaffWorkingHistoryPrivate_governStaffID_fkey";
ALTER TABLE "governStaffPositionHistory" DROP CONSTRAINT IF EXISTS "governStaffPositionHistory_governStaffID_fkey";
ALTER TABLE "governStaffCertificateLevelup" DROP CONSTRAINT IF EXISTS "governStaffCertificateLevelup_governStaffID_fkey";
ALTER TABLE "governStaffSituationOutsideOriginalOfficial" DROP CONSTRAINT IF EXISTS "governStaffSituationOutsideOriginalOfficial_governStaffID_fkey";
ALTER TABLE "governStaffFreeNoSalary" DROP CONSTRAINT IF EXISTS "governStaffFreeNoSalary_governStaffID_fkey";
ALTER TABLE "governStaffLetterAppreciation" DROP CONSTRAINT IF EXISTS "governStaffLetterAppreciation_governStaffID_fkey";
ALTER TABLE "governStaffFineHistory" DROP CONSTRAINT IF EXISTS "governStaffFineHistory_governStaffID_fkey";

-- Clean up any rows already orphaned before re-adding the constraints.
DELETE FROM "governStaffChildren" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffQualifitcation" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffLanuage" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffWorkingHistoryPublic" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffWorkingHistoryPrivate" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffPositionHistory" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffCertificateLevelup" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffSituationOutsideOriginalOfficial" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffFreeNoSalary" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffLetterAppreciation" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");
DELETE FROM "governStaffFineHistory" WHERE "governStaffID" NOT IN (SELECT id FROM "governStaff");

ALTER TABLE "governStaffChildren"
  ADD CONSTRAINT "governStaffChildren_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffQualifitcation"
  ADD CONSTRAINT "governStaffQualifitcation_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffLanuage"
  ADD CONSTRAINT "governStaffLanuage_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffWorkingHistoryPublic"
  ADD CONSTRAINT "governStaffWorkingHistoryPublic_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffWorkingHistoryPrivate"
  ADD CONSTRAINT "governStaffWorkingHistoryPrivate_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffPositionHistory"
  ADD CONSTRAINT "governStaffPositionHistory_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffCertificateLevelup"
  ADD CONSTRAINT "governStaffCertificateLevelup_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffSituationOutsideOriginalOfficial"
  ADD CONSTRAINT "governStaffSituationOutsideOriginalOfficial_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffFreeNoSalary"
  ADD CONSTRAINT "governStaffFreeNoSalary_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffLetterAppreciation"
  ADD CONSTRAINT "governStaffLetterAppreciation_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "governStaffFineHistory"
  ADD CONSTRAINT "governStaffFineHistory_governStaffID_fkey"
  FOREIGN KEY ("governStaffID") REFERENCES "governStaff"(id) ON DELETE CASCADE ON UPDATE CASCADE;
