-- Drop ក្រុមស្តារនីតិសម្បទា, ប្រភេទស្តារនីតិសម្បទា and សេវាកម្មស្តារនីតិសម្បទាលម្អិត.
--
-- The manual names the first two levels for only four of its seven groups and
-- never enumerates the third, so three groups dead-ended with an empty second
-- dropdown and the third level had no source of values at all -- there was no
-- way to fill it in through the app, and the codes seeded for it were
-- positional placeholders rather than ministry codes. The fields are removed
-- rather than left as three permanently unusable selects on ទម្រង់ទី២.
--
-- This discards any answers already recorded in those three columns. Unlike the
-- other destructive migrations here it does not abort on finding data, because
-- discarding it is the point -- but it says how much it is discarding, so the
-- deploy log carries a record rather than the loss being silent.

DO $$
DECLARE
  answered bigint;
BEGIN
  SELECT count(*) INTO answered
    FROM "clientServices"
   WHERE "rehabGroupId" IS NOT NULL
      OR "rehabTypeId" IS NOT NULL
      OR "rehabilitationId" IS NOT NULL;

  IF answered > 0 THEN
    RAISE NOTICE 'drop_rehabilitation_taxonomy: discarding rehabilitation answers on % ទម្រង់ទី២ record(s)', answered;
  ELSE
    RAISE NOTICE 'drop_rehabilitation_taxonomy: no rehabilitation answers recorded; nothing discarded';
  END IF;
END $$;

-- Dropping the columns takes their foreign keys with them, which has to happen
-- before the tables they point at can go.
ALTER TABLE "clientServices"
  DROP COLUMN IF EXISTS "rehabGroupId",
  DROP COLUMN IF EXISTS "rehabTypeId",
  DROP COLUMN IF EXISTS "rehabilitationId";

-- Child before parent: rehabilitations -> rehabTypes -> rehabGroups.
DROP TABLE IF EXISTS "rehabilitations";
DROP TABLE IF EXISTS "rehabTypes";
DROP TABLE IF EXISTS "rehabGroups";
