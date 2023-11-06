-- DropForeignKey
ALTER TABLE "Staff" DROP CONSTRAINT "Staff_serviceCenterID_fkey";

-- AlterTable
ALTER TABLE "Staff" ALTER COLUMN "serviceCenterID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_serviceCenterID_fkey" FOREIGN KEY ("serviceCenterID") REFERENCES "ServiceCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
