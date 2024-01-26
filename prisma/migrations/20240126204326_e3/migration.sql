-- DropForeignKey
ALTER TABLE "governStaffChildren" DROP CONSTRAINT "governStaffChildren_governStaffID_fkey";

-- AlterTable
ALTER TABLE "governStaffChildren" ALTER COLUMN "governStaffID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "governStaffChildren" ADD CONSTRAINT "governStaffChildren_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
