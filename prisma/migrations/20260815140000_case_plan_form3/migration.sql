-- ទម្រង់ទី៣ ផែនការករណីរបស់អតិថិជន.
--
-- Two tables: the plan, and its ក. សកម្មភាពសេវាកម្ម rows. The manual ends that
-- list with អាចបន្ថែមច្រើនទៀត, so the activities are a child table rather than a
-- fixed set of columns.
--
-- Section ១ of the manual is not stored: Client_PersonalInformation already
-- holds the code, name, gender, date of birth, family phone and family address,
-- and they are read through the relation instead of copied.

-- services.code -- the manual writes every service reference as
-- (លេខកូដ*, ឈ្មោះខ្មែរ, ឈ្មោះអង់គ្លេស, បរិយាយ) and marks the code required, but
-- this table was keyed only by name. The sequence has to exist before the
-- column that defaults to it. Postgres evaluates a volatile default once per
-- existing row, so services already in the table are numbered as they are
-- rewritten rather than left null.
CREATE SEQUENCE IF NOT EXISTS service_code_seq;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "code" TEXT NOT NULL DEFAULT ('SV'::text || lpad((nextval('service_code_seq'::regclass))::text, 3, '0'::text));

-- CreateTable
CREATE TABLE "casePlans" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "providerName" TEXT,
    "socialWorkerName" TEXT,
    "socialWorkerPhone" TEXT,
    "referralReason" TEXT,
    "challenges" TEXT,
    "situationAssessment" TEXT,
    "monitorDate" TIMESTAMP(3),
    "monitorMethod" TEXT,
    "monitorResult" TEXT,
    "nextMonitorDate" TIMESTAMP(3),
    "conclusion" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "submittedByID" TEXT,
    "decidedAt" TIMESTAMP(3),
    "decidedByID" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casePlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casePlanActivities" (
    "id" TEXT NOT NULL,
    "casePlanId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casePlanActivities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "casePlans_clientId_idx" ON "casePlans"("clientId");

-- CreateIndex
CREATE INDEX "casePlans_approvalStatus_idx" ON "casePlans"("approvalStatus");

-- CreateIndex
CREATE INDEX "casePlanActivities_casePlanId_sortOrder_idx" ON "casePlanActivities"("casePlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "casePlanActivities_serviceId_idx" ON "casePlanActivities"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- AddForeignKey
ALTER TABLE "casePlans" ADD CONSTRAINT "casePlans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client_PersonalInformation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casePlanActivities" ADD CONSTRAINT "casePlanActivities_casePlanId_fkey" FOREIGN KEY ("casePlanId") REFERENCES "casePlans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casePlanActivities" ADD CONSTRAINT "casePlanActivities_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

