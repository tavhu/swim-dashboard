-- AlterTable
ALTER TABLE "Staff" ADD COLUMN     "familyAddressCity" TEXT,
ADD COLUMN     "familyAddressCommune" TEXT,
ADD COLUMN     "familyAddressDistrict" TEXT,
ADD COLUMN     "familyAddressVillage" TEXT,
ALTER COLUMN "familyAddress" DROP NOT NULL;

-- AlterTable
ALTER TABLE "governStaff" ADD COLUMN     "ECAddressCity" TEXT,
ADD COLUMN     "ECAddressCommune" TEXT,
ADD COLUMN     "ECAddressDistrict" TEXT,
ADD COLUMN     "ECAddressVillage" TEXT,
ADD COLUMN     "fatherBirthAddressCity" TEXT,
ADD COLUMN     "fatherBirthAddressCommune" TEXT,
ADD COLUMN     "fatherBirthAddressDistrict" TEXT,
ADD COLUMN     "fatherBirthAddressVillage" TEXT,
ADD COLUMN     "motherBirthAddressCity" TEXT,
ADD COLUMN     "motherBirthAddressCommune" TEXT,
ADD COLUMN     "motherBirthAddressDistrict" TEXT,
ADD COLUMN     "motherBirthAddressVillage" TEXT,
ADD COLUMN     "spouseBirthCity" TEXT,
ADD COLUMN     "spouseBirthCommune" TEXT,
ADD COLUMN     "spouseBirthDistrict" TEXT,
ADD COLUMN     "spouseBirthVillage" TEXT,
ADD COLUMN     "spuseCurrentAddressCity" TEXT,
ADD COLUMN     "spuseCurrentAddressCommune" TEXT,
ADD COLUMN     "spuseCurrentAddressDistrict" TEXT,
ADD COLUMN     "spuseCurrentAddressVillage" TEXT;
