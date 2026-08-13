-- Index tidy-up for ApprovalEvent.
--
-- The previous migration created "ApprovalEvent_recordType_recordId_idx".
-- Databases carrying the workflow from the earlier branch instead had an index
-- on (recordType, recordId, createdAt) plus one on actorID. The three-column
-- version is strictly better — a leading-column prefix serves the same lookups
-- and it also orders a record's history — so standardise on that pair.
--
-- A separate migration rather than an edit to the previous one: that migration
-- has already been applied, and changing an applied migration's checksum makes
-- Prisma report the history as tampered with.

-- Reading one record's approval history, newest first.
CREATE INDEX IF NOT EXISTS "ApprovalEvent_recordType_recordId_createdAt_idx"
    ON "ApprovalEvent"("recordType", "recordId", "createdAt");

-- The actorID foreign key is ON DELETE RESTRICT, so deleting a user scans this
-- table. Postgres does not create an index for a foreign key automatically.
CREATE INDEX IF NOT EXISTS "ApprovalEvent_actorID_idx"
    ON "ApprovalEvent"("actorID");

-- Redundant now: its columns are a prefix of the index above.
DROP INDEX IF EXISTS "ApprovalEvent_recordType_recordId_idx";
