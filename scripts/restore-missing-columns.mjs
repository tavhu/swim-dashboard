#!/usr/bin/env node
/**
 * Recreates columns that pending migrations expect to find.
 *
 * `20260812200000_consolidate_addresses` dropped several free-text address
 * columns after copying them into six-part fields. The pending migrations from
 * origin/main still reference them — `ALTER COLUMN "currentAddress" DROP NOT
 * NULL` — and abort when they're gone.
 *
 * origin/main's schema keeps all of them as nullable, so recreating them empty
 * is faithful to where the branch is heading: the data already lives in the
 * six-part columns, and these become unused legacy fields.
 *
 * Scope is derived from the pending migrations themselves rather than
 * hardcoded, so it also covers collisions I haven't seen yet.
 *
 *   node scripts/restore-missing-columns.mjs           # report
 *   node scripts/restore-missing-columns.mjs --apply
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const MIGRATIONS = path.resolve(process.cwd(), "prisma", "migrations");
const q = (s) => `"${s.replace(/"/g, '""')}"`;

try {
  const applied = new Set(
    (
      await prisma.$queryRawUnsafe(
        `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
      )
    ).map((r) => r.migration_name)
  );

  const pending = fs
    .readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !applied.has(d.name))
    .map((d) => d.name)
    .sort();

  // Columns a pending migration will ALTER or DROP. Both require the column to
  // exist: unqualified DROP COLUMN raises 42703 when it doesn't, the same as
  // ALTER COLUMN. Recreating a column that is about to be dropped looks odd,
  // but it is what lets the migration run and record itself as applied.
  const needed = new Map(); // "table.column" -> {table, column, migration, why}
  for (const name of pending) {
    const file = path.join(MIGRATIONS, name, "migration.sql");
    if (!fs.existsSync(file)) continue;
    const sql = fs
      .readFileSync(file, "utf8")
      .replace(/--[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    for (const stmt of sql.split(";")) {
      const s = stmt.trim().replace(/\s+/g, " ");
      const m = s.match(/^ALTER TABLE "([^"]+)" (.+)$/i);
      if (!m) continue;
      const table = m[1];
      for (const action of m[2].split(/,\s*(?=ADD |DROP |ALTER |RENAME )/i)) {
        const alter = action.match(/^ALTER COLUMN "([^"]+)"/i);
        // Only unguarded drops need the column present.
        const drop = action.match(/^DROP COLUMN (IF EXISTS )?"([^"]+)"/i);

        let column = null;
        let why = null;
        if (alter) {
          column = alter[1];
          why = "ALTER COLUMN";
        } else if (drop && !drop[1]) {
          column = drop[2];
          why = "DROP COLUMN";
        }
        if (!column) continue;

        const key = `${table}.${column}`;
        if (!needed.has(key))
          needed.set(key, { table, column, migration: name, why });
      }
    }
  }

  const existing = new Set(
    (
      await prisma.$queryRawUnsafe(
        `SELECT table_name, column_name FROM information_schema.columns
         WHERE table_schema='public'`
      )
    ).map((r) => `${r.table_name}.${r.column_name}`)
  );

  const missing = [...needed.values()].filter(
    (n) => !existing.has(`${n.table}.${n.column}`)
  );

  console.log(
    `\n=== COLUMNS PENDING MIGRATIONS NEED TO EXIST (${needed.size}) ===`
  );
  for (const n of needed.values()) {
    const ok = existing.has(`${n.table}.${n.column}`);
    console.log(
      `  ${(n.table + "." + n.column).padEnd(36)} ${(ok ? "present" : "MISSING").padEnd(8)} ${n.why.padEnd(13)} ${n.migration}`
    );
  }

  if (missing.length === 0) {
    console.log("\nNothing to recreate.\n");
    process.exit(0);
  }

  console.log(`\n=== WOULD RECREATE (${missing.length}) ===`);
  for (const n of missing) {
    console.log(`  ALTER TABLE ${q(n.table)} ADD COLUMN ${q(n.column)} TEXT;`);
  }
  console.log(
    "\n  Nullable and empty. The values these held were copied into the\n" +
      "  six-part address columns before being dropped, so nothing is lost —\n" +
      "  origin/main keeps them as optional legacy fields."
  );

  if (!APPLY) {
    console.log("\nDry run. Rerun with --apply.\n");
    process.exit(0);
  }

  for (const n of missing) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${q(n.table)} ADD COLUMN IF NOT EXISTS ${q(n.column)} TEXT`
    );
    console.log(`  recreated ${n.table}.${n.column}`);
  }

  // Name the migrations actually involved rather than a hardcoded example —
  // a copy-pasteable command for the wrong migration is worse than none.
  const failed = (
    await prisma.$queryRawUnsafe(
      `SELECT migration_name FROM "_prisma_migrations"
       WHERE finished_at IS NULL AND rolled_back_at IS NULL`
    )
  ).map((r) => r.migration_name);

  console.log("\nNext:");
  for (const name of failed) {
    console.log(`  npx prisma migrate resolve --rolled-back ${name}`);
  }
  console.log("  node scripts/migration-preflight.mjs");
  console.log("  npx prisma migrate deploy\n");
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
