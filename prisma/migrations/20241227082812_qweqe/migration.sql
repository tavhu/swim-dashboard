-- CreateTable
CREATE TABLE "CenterPlan" (
    "id" TEXT NOT NULL,
    "actvityPlan" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "yearPlan" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "serviceCenterID" TEXT,

    CONSTRAINT "CenterPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CenterPlan_id_key" ON "CenterPlan"("id");

-- AddForeignKey
ALTER TABLE "CenterPlan" ADD CONSTRAINT "CenterPlan_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
