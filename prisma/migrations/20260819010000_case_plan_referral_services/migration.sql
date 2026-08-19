-- ខ. សេវាបញ្ចូនបន្ត on ទម្រង់ទី៣.
--
-- The plan already carries ក. សកម្មភាពសេវាកម្ម — what this centre will do
-- itself. This is the second list: services the client is referred onward to.
--
-- A separate table rather than a `kind` column on casePlanActivities. The two
-- print under their own headings, are numbered ១, ២, ៣ independently, and are
-- edited as separate blocks; sharing one table would mean every read filtering
-- by kind and every write remembering to set it, to save a table.
--
-- Cascade on the plan, like the activities: these rows belong to the plan rather
-- than being records in their own right.

-- CreateTable
CREATE TABLE "casePlanReferralServices" (
    "id" TEXT NOT NULL,
    "casePlanId" TEXT NOT NULL,
    "serviceId" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casePlanReferralServices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "casePlanReferralServices_casePlanId_sortOrder_idx" ON "casePlanReferralServices"("casePlanId", "sortOrder");

-- CreateIndex
CREATE INDEX "casePlanReferralServices_serviceId_idx" ON "casePlanReferralServices"("serviceId");

-- AddForeignKey
ALTER TABLE "casePlanReferralServices" ADD CONSTRAINT "casePlanReferralServices_casePlanId_fkey" FOREIGN KEY ("casePlanId") REFERENCES "casePlans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casePlanReferralServices" ADD CONSTRAINT "casePlanReferralServices_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;
