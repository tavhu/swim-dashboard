-- ឈ្មោះសេវា (អង់គ្លេស).
--
-- The manual writes every service reference as (លេខកូដ*, ឈ្មោះខ្មែរ,
-- ឈ្មោះអង់គ្លេស, បរិយាយ), and ទម្រង់ទី២ to ទី៥ all display service names, but the
-- table only ever had a Khmer one. Nullable: a centre entering a service in
-- Khmer must not be blocked for want of a translation, and the UI falls back to
-- the Khmer name in either language.

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "nameEn" TEXT;

