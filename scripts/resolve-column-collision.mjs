#!/usr/bin/env node
/**
 * Clears the way for `prisma migrate deploy` when a pending migration wants to
 * add a column that already exists.
 *
 * Here: `20241024032348_newmigrate` adds Staff.familyAddress{Commune,District,
 * Village}, which an out-of-branch migration added first. The migration aborts
 * on "column already exists" and leaves itself half applied.
 *
 * The alternative — editing the migration to ADD COLUMN IF NOT EXISTS —
 * changes its checksum and leaves this repo permanently diverged from
 * origin/main in a file that must never diverge. So fix the database instead:
 * rescue any data, drop the duplicates, let the migration create them.
 *
 *   node scripts/resolve-column-collision.mjs            # report only
 *   node scripts/resolve-column-collision.mjs --apply    # rescue + drop
 *   node scripts/resolve-column-collision.mjs --restore  # after migrate deploy
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const RESTORE = args.includes("--restore");

/**
 * Hardcoded, not derived from input — these identifiers are interpolated into
 * SQL below, so they must never come from anywhere a caller can influence.
 */
const TARGET = {
  table: "Staff",
  key: "id",
  columns: ["familyAddressCommune", "familyAddressDistrict", "familyAddressVillage"],
};

const RESCUE_DIR = path.resolve(process.cwd(), "backups");
const RESCUE_FILE = path.join(RESCUE_DIR, "column-rescue-Staff-familyAddress.json");

const q = (s) => `"${s.replace(/"/g, '""')}"`;

try {
  const existing = (
    await prisma.$queryRawUnsafe(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1`,
      TARGET.table
    )
  ).map((r) => r.column_name);

  const present = TARGET.columns.filter((c) => existing.includes(c));
  const absent = TARGET.columns.filter((c) => !existing.includes(c));

  // ---------------------------------------------------------------- restore
  if (RESTORE) {
    if (!fs.existsSync(RESCUE_FILE)) {
      console.log("\nNothing to restore — no rescue file.\n");
      process.exit(0);
    }
    if (absent.length) {
      console.error(
        `\nColumns still missing: ${absent.join(", ")}\n` +
          "Run `npx prisma migrate deploy` first so the migration recreates them.\n"
      );
      process.exitCode = 1;
      process.exit();
    }
    const rows = JSON.parse(fs.readFileSync(RESCUE_FILE, "utf8"));
    let n = 0;
    for (const row of rows) {
      const sets = TARGET.columns
        .map((c, i) => `${q(c)} = $${i + 1}`)
        .join(", ");
      await prisma.$executeRawUnsafe(
        `UPDATE ${q(TARGET.table)} SET ${sets} WHERE ${q(TARGET.key)} = $${TARGET.columns.length + 1}`,
        ...TARGET.columns.map((c) => row[c] ?? null),
        row[TARGET.key]
      );
      n++;
    }
    console.log(`\nRestored ${n} row${n === 1 ? "" : "s"}.\n`);
    console.log(`You can delete ${RESCUE_FILE} once you've checked the data.\n`);
    process.exit(0);
  }

  // ----------------------------------------------------------------- report
  console.log(`\n=== ${TARGET.table} — colliding columns ===`);
  for (const c of TARGET.columns) {
    console.log(`  ${c.padEnd(24)} ${present.includes(c) ? "present" : "absent"}`);
  }

  if (present.length === 0) {
    console.log("\nNothing to do — the migration will apply cleanly.\n");
    process.exit(0);
  }

  const notNull = present.map((c) => `${q(c)} IS NOT NULL`).join(" OR ");
  const withData = await prisma.$queryRawUnsafe(
    `SELECT ${q(TARGET.key)}, ${present.map(q).join(", ")}
     FROM ${q(TARGET.table)} WHERE ${notNull}`
  );

  console.log(
    `\n  ${withData.length} row${withData.length === 1 ? "" : "s"} hold data in these columns.`
  );
  if (withData.length) {
    console.log("  It will be saved to a rescue file and written back after the migration.");
  }

  if (!APPLY) {
    console.log("\nDry run. Rerun with --apply to rescue the data and drop the columns.\n");
    process.exit(0);
  }

  // ------------------------------------------------------------------ apply
  if (withData.length) {
    fs.mkdirSync(RESCUE_DIR, { recursive: true });
    fs.writeFileSync(RESCUE_FILE, JSON.stringify(withData, null, 2));
    console.log(`\n  Saved ${withData.length} row(s) to ${RESCUE_FILE}`);
  }

  for (const c of present) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE ${q(TARGET.table)} DROP COLUMN ${q(c)}`
    );
    console.log(`  dropped ${TARGET.table}.${c}`);
  }

  console.log(
    "\nNext:\n" +
      "  npx prisma migrate deploy\n" +
      "  npx prisma generate\n" +
      (withData.length
        ? "  node scripts/resolve-column-collision.mjs --restore\n"
        : "")
  );
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
