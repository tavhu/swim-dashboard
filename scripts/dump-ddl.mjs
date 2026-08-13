#!/usr/bin/env node
/**
 * Prints the real structure of tables, columns and enums.
 *
 * Needed because the approval workflow exists only in this database — there's
 * no migration to read it from, and reconstructing it from memory is how you
 * end up with a migration that doesn't match what's already there.
 *
 * Structure only: table names, column names, types, nullability. No row data.
 *
 *   node scripts/dump-ddl.mjs                       # the approval + address work
 *   node scripts/dump-ddl.mjs ApprovalEvent Staff   # named tables
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith("--"));
/** Restrict a wide table to the columns you care about. */
const LIKE = args.find((a) => a.startsWith("--like="))?.slice("--like=".length);

const DEFAULT_TABLES = ["ApprovalEvent", "Organisation"];
const ADDRESS_TABLES = [
  "Client_PersonalInformation",
  "ServiceCenter",
  "Staff",
  "governStaff",
];

try {
  const tables = named.length ? named : DEFAULT_TABLES;

  // --- enums ---------------------------------------------------------------
  const enums = await prisma.$queryRawUnsafe(`
    SELECT t.typname AS name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS labels
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname ORDER BY t.typname
  `);
  console.log(`\n=== ENUMS (${enums.length}) ===`);
  for (const e of enums) console.log(`  ${e.name}: ${e.labels}`);

  // --- tables --------------------------------------------------------------
  for (const table of tables) {
    const cols = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default,
              character_maximum_length
       FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1
         AND ($2::text IS NULL OR column_name ILIKE '%' || $2 || '%')
       ORDER BY ordinal_position`,
      table,
      LIKE ?? null
    );
    console.log(`\n=== ${table} (${cols.length} columns) ===`);
    if (cols.length === 0) {
      console.log("  — does not exist —");
      continue;
    }
    for (const c of cols) {
      const type =
        c.data_type === "USER-DEFINED"
          ? c.udt_name
          : c.data_type === "character varying" && c.character_maximum_length
            ? `varchar(${c.character_maximum_length})`
            : c.data_type;
      console.log(
        `  ${c.column_name.padEnd(30)} ${type.padEnd(28)} ${c.is_nullable === "NO" ? "NOT NULL" : "null    "}  ${c.column_default ?? ""}`
      );
    }

    const cons = await prisma.$queryRawUnsafe(
      `SELECT con.conname, pg_get_constraintdef(con.oid) AS def
       FROM pg_constraint con
       JOIN pg_class rel ON rel.oid = con.conrelid
       JOIN pg_namespace n ON n.oid = rel.relnamespace
       WHERE n.nspname='public' AND rel.relname=$1
       ORDER BY con.conname`,
      table
    );
    if (cons.length) {
      console.log(`  -- constraints`);
      for (const c of cons) console.log(`  ${c.conname}: ${c.def}`);
    }
  }

  // --- address columns, side by side --------------------------------------
  if (!named.length) {
    console.log(`\n=== ADDRESS COLUMNS BY TABLE ===`);
    for (const table of ADDRESS_TABLES) {
      const cols = await prisma.$queryRawUnsafe(
        `SELECT column_name, is_nullable FROM information_schema.columns
         WHERE table_schema='public' AND table_name=$1
           AND (column_name ILIKE '%address%' OR column_name ILIKE '%BA'
                OR column_name IN ('Village','Communte','City','District','Address'))
         ORDER BY column_name`,
        table
      );
      console.log(`\n  ${table} (${cols.length})`);
      for (const c of cols)
        console.log(
          `      ${c.column_name.padEnd(34)} ${c.is_nullable === "NO" ? "NOT NULL" : ""}`
        );

      const n = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*)::int AS n FROM "${table.replace(/"/g, '""')}"`
      );
      console.log(`      -- ${n[0].n} row(s)`);
    }
  }

  console.log("");
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
