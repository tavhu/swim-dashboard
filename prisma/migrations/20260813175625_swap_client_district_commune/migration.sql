-- districtBA and communeBA were populated the wrong way round.
--
-- The register form's second dropdown is labelled ស្រុក-ខណ្ឌ and is fed the
-- district list, but wrote to communeBA; the third is labelled ឃុំ/សង្កាត់, is
-- fed the commune list, and wrote to districtBA. So every client saved so far
-- holds its district in communeBA and its commune in districtBA.
--
-- The edit-loading code read them the other way round — the way the column
-- names say — so reopening a saved client also built its dropdowns from the
-- wrong column. The form is now aligned on the column names, which leaves the
-- stored rows to be put right.
--
-- One statement, so there is no moment where the two columns disagree. A swap
-- is not idempotent by nature: running it twice restores the original state.
-- Prisma records the migration, so it applies once.
UPDATE "Client_PersonalInformation"
   SET "districtBA" = "communeBA",
       "communeBA"  = "districtBA"
 WHERE "districtBA" IS DISTINCT FROM "communeBA";
