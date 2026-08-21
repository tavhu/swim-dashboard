-- AlterTable: add bilingual columns for About page
ALTER TABLE "aboutPage" ADD COLUMN IF NOT EXISTS "titleKh" TEXT;
ALTER TABLE "aboutPage" ADD COLUMN IF NOT EXISTS "titleEn" TEXT;
ALTER TABLE "aboutPage" ADD COLUMN IF NOT EXISTS "contentKh" TEXT;
ALTER TABLE "aboutPage" ADD COLUMN IF NOT EXISTS "contentEn" TEXT;

-- Move existing Khmer content into the new Khmer columns
UPDATE "aboutPage"
SET
  "titleKh"   = COALESCE("titleKh", "title"),
  "contentKh" = COALESCE("contentKh", "content")
WHERE "title" IS NOT NULL OR "content" IS NOT NULL;