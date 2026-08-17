-- districtBA and communeBA were populated the wrong way round.
--
-- The register form's second dropdown is labelled ស្រុក-ខណ្ឌ and is fed the
-- district list, but wrote to communeBA; the third is labelled ឃុំ/សង្កាត់, is
-- fed the commune list, and wrote to districtBA. So every client saved before
-- the fix holds its district in communeBA and its commune in districtBA.
--
-- The edit-loading code read them the other way round — the way the column
-- names say — so reopening a saved client also built its dropdowns from the
-- wrong column. The form is now aligned on the column names, which leaves the
-- stored rows to be put right.
--
-- The swap is guarded rather than unconditional, because a bare swap is correct
-- exactly once and silently destructive the second time. Gazetteer codes carry
-- their own level in their length -- province 2 digits, district 4, commune 6,
-- village 8 -- so a row that is the wrong way round is one holding a 6-digit
-- code in districtBA and a 4-digit code in communeBA. Only those are touched.
--
-- That makes this idempotent: re-running it, restoring a backup taken after it
-- ran, or losing the _prisma_migrations row can no longer put the data back the
-- way it was. Rows already correct, and rows where either code is missing or
-- malformed, are left alone.
--
-- One statement, so there is no moment where the two columns disagree.
UPDATE "Client_PersonalInformation"
   SET "districtBA" = "communeBA",
       "communeBA"  = "districtBA"
 WHERE length("districtBA") = 6
   AND length("communeBA")  = 4;
