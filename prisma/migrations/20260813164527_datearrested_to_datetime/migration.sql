-- DateArrested holds កាលបរិច្ឆេទចូលមជ្ឈមណ្ឌល — a date — but was declared String
-- and backed by a free-text input, so staff could type anything into it.
--
-- Refuse rather than discard. A plain USING cast aborts on the first
-- unparseable value with a message that does not say how widespread the problem
-- is, and a guarded cast that nulls what it cannot read would silently destroy
-- entries in a system of case records. This counts the bad rows first and stops
-- with a message naming the number, so they can be corrected and the migration
-- re-run. On a database where every value already parses, it is a no-op.
DO $$
DECLARE bad integer;
BEGIN
  SELECT count(*) INTO bad
    FROM "Client_PersonalInformation"
   WHERE "DateArrested" IS NOT NULL
     AND btrim("DateArrested") <> ''
     AND btrim("DateArrested") !~ '^\d{4}-\d{2}-\d{2}';

  IF bad > 0 THEN
    RAISE EXCEPTION
      'DateArrested: % row(s) contain text that is not an ISO date (YYYY-MM-DD). Correct them before migrating; nothing has been changed.', bad;
  END IF;
END $$;

ALTER TABLE "Client_PersonalInformation"
  ALTER COLUMN "DateArrested" TYPE TIMESTAMP(3)
  USING NULLIF(btrim("DateArrested"), '')::timestamp(3);
