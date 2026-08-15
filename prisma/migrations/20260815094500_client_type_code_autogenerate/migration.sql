-- ប្រភេទអតិថិជន codes.
--
-- `code` is NOT NULL UNIQUE with no default, so every insert had to supply one.
-- The settings screen lets an admin type an official ministry code, but most
-- categories do not have one, and asking a data-entry clerk to invent unique
-- codes is how duplicates happen. A sequence default fills the blank case
-- without a read-then-write, so two admins adding a category at the same moment
-- cannot collide -- the same approach already used for client ReadableCode.

CREATE SEQUENCE IF NOT EXISTS client_type_code_seq;

-- Any rows already carrying a CT-style code keep it, and the sequence starts
-- past them so a generated code cannot collide with one entered earlier. The
-- third argument is `is_called`: false on an empty table so the first code is
-- CT001 rather than CT002, true when there are rows to skip over.
SELECT setval(
  'client_type_code_seq',
  GREATEST(
    (SELECT COALESCE(MAX(substring("code" FROM '^CT([0-9]+)$')::bigint), 0)
       FROM "clientTypes"
      WHERE "code" ~ '^CT[0-9]+$'),
    1
  ),
  (SELECT EXISTS (SELECT 1 FROM "clientTypes" WHERE "code" ~ '^CT[0-9]+$'))
);

ALTER TABLE "clientTypes"
  ALTER COLUMN "code"
  SET DEFAULT ('CT'::text || lpad((nextval('client_type_code_seq'::regclass))::text, 3, '0'::text));
