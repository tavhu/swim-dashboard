-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActivityEntityType" AS ENUM (
    'CLIENT', 'CLIENT_SERVICE', 'CASE_PLAN', 'REINTEGRATION', 'FOLLOW_UP', 'CASE_CLOSURE',
    'SERVICE', 'CENTER', 'STAFF', 'GOVERN_STAFF', 'USER', 'ROLE', 'ORGANISATION',
    'CLIENT_TYPE', 'REFERRAL_TYPE', 'ABOUT', 'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "activityLogs" (
    "id" TEXT NOT NULL,
    "actorID" TEXT,
    "actorName" TEXT,
    "actorUsername" TEXT,
    "action" "ActivityAction" NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT,
    "summary" TEXT,
    "metadata" JSONB,
    "serviceCenterID" TEXT,
    "centreName" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activityLogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "activityLogSettings" (
    "id" TEXT NOT NULL DEFAULT 'activity-log',
    "retentionYears" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByID" TEXT,
    CONSTRAINT "activityLogSettings_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "activityLogs_createdAt_idx" ON "activityLogs"("createdAt");
CREATE INDEX IF NOT EXISTS "activityLogs_actorID_createdAt_idx" ON "activityLogs"("actorID", "createdAt");
CREATE INDEX IF NOT EXISTS "activityLogs_entityType_entityId_createdAt_idx" ON "activityLogs"("entityType", "entityId", "createdAt");
CREATE INDEX IF NOT EXISTS "activityLogs_action_createdAt_idx" ON "activityLogs"("action", "createdAt");
CREATE INDEX IF NOT EXISTS "activityLogs_serviceCenterID_createdAt_idx" ON "activityLogs"("serviceCenterID", "createdAt");

-- ForeignKey (SetNull on user delete)
DO $$ BEGIN
  ALTER TABLE "activityLogs"
    ADD CONSTRAINT "activityLogs_actorID_fkey"
    FOREIGN KEY ("actorID") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed default settings row
INSERT INTO "activityLogSettings" ("id", "retentionYears", "updatedAt")
VALUES ('activity-log', 5, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;