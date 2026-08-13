-- Brings the migration history back in line with schema.prisma.
--
-- Two unrelated gaps are closed here because both must be true before any
-- future `prisma migrate dev` will run without offering to reset the database.
--
--  1. Organisation / AccountType. These are in schema.prisma on main but no
--     migration ever created them — the schema was edited without generating
--     one. Endpoints reference `organisationID` and `accountType`, so on any
--     database built purely from migrations they fail.
--
--  2. The approval workflow (ស្នើឡើង / អនុម័ត / បដិសេធ). Built on an earlier
--     branch, so it exists in some databases but in no migration here.
--
-- Every statement is guarded. A database that already has one half and not the
-- other converges on the same result as a fresh one, which is the only way a
-- single migration can serve both.

-- ---------------------------------------------------------------- enums ----
-- CREATE TYPE has no IF NOT EXISTS, hence the exception handler.
DO $$ BEGIN
    CREATE TYPE "AccountType" AS ENUM ('USER', 'ORGANISATION');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ApprovalRecordType" AS ENUM ('CLIENT', 'CLIENT_SERVICE', 'CASE_PLAN', 'REINTEGRATION', 'FOLLOW_UP', 'CASE_CLOSURE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- --------------------------------------------------------- organisation ----
CREATE TABLE IF NOT EXISTS "Organisation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "parentId" TEXT,

    CONSTRAINT "Organisation_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organisationID" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" "AccountType" NOT NULL DEFAULT 'USER';
ALTER TABLE "ServiceCenter" ADD COLUMN IF NOT EXISTS "organisationID" TEXT;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "organisationID" TEXT;
ALTER TABLE "governStaff" ADD COLUMN IF NOT EXISTS "organisationID" TEXT;

-- ------------------------------------------------------------- approval ----
CREATE TABLE IF NOT EXISTS "ApprovalEvent" (
    "id" TEXT NOT NULL,
    "recordType" "ApprovalRecordType" NOT NULL,
    "recordId" TEXT NOT NULL,
    "fromStatus" "ApprovalStatus",
    "toStatus" "ApprovalStatus" NOT NULL,
    "actorID" TEXT NOT NULL,
    "reason" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ApprovalEvent_recordType_recordId_idx"
    ON "ApprovalEvent"("recordType", "recordId");

-- Existing rows default to DRAFT, so nothing is treated as approved by
-- accident — a record has to be submitted and approved explicitly.
ALTER TABLE "Client_PersonalInformation"
    ADD COLUMN IF NOT EXISTS "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "submittedByID" TEXT,
    ADD COLUMN IF NOT EXISTS "decidedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "decidedByID" TEXT,
    ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- ---------------------------------------------------------- foreign keys ----
-- ADD CONSTRAINT has no IF NOT EXISTS either.
DO $$ BEGIN
    ALTER TABLE "Organisation" ADD CONSTRAINT "Organisation_parentId_fkey"
        FOREIGN KEY ("parentId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_organisationID_fkey"
        FOREIGN KEY ("organisationID") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "ServiceCenter" ADD CONSTRAINT "ServiceCenter_organisationID_fkey"
        FOREIGN KEY ("organisationID") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "Staff" ADD CONSTRAINT "Staff_organisationID_fkey"
        FOREIGN KEY ("organisationID") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "governStaff" ADD CONSTRAINT "governStaff_organisationID_fkey"
        FOREIGN KEY ("organisationID") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RESTRICT, not CASCADE: an approval history must not disappear because the
-- user who made the decision was later deleted.
DO $$ BEGIN
    ALTER TABLE "ApprovalEvent" ADD CONSTRAINT "ApprovalEvent_actorID_fkey"
        FOREIGN KEY ("actorID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
