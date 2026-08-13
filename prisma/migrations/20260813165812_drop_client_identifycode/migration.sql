-- Client_PersonalInformation.IdentifyCode (លេខកូដ) is redundant with
-- ReadableCode (លេខសំគាល់), which is the code intake staff actually enter.
--
-- The column was unreachable in practice: its input carried `disabled`, and
-- nothing in the application ever assigned it a value, so the app can only ever
-- have written ''. Older data predating that is possible, though, and dropping
-- a column is irreversible — so stop if anything meaningful is in there rather
-- than discard it. On a database where the column is empty, this is a no-op.
DO $$
DECLARE populated integer;
BEGIN
  SELECT count(*) INTO populated
    FROM "Client_PersonalInformation"
   WHERE "IdentifyCode" IS NOT NULL
     AND btrim("IdentifyCode") <> '';

  IF populated > 0 THEN
    RAISE EXCEPTION
      'IdentifyCode: % row(s) still hold a value. Copy or discard them deliberately before dropping the column; nothing has been changed.', populated;
  END IF;
END $$;

ALTER TABLE "Client_PersonalInformation" DROP COLUMN "IdentifyCode";
