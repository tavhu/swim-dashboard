/*
  Warnings:

  - Made the column `governStaffID` on table `governStaffChildren` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "governStaffChildren" DROP CONSTRAINT "governStaffChildren_governStaffID_fkey";

-- AlterTable
ALTER TABLE "governStaffChildren" ALTER COLUMN "governStaffID" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "governStaffChildren" ADD CONSTRAINT "governStaffChildren_governStaffID_fkey" FOREIGN KEY ("governStaffID") REFERENCES "governStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
