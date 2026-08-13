#!/usr/bin/env node
/**
 * Applies a migration whose SQL can't run as written, then leaves you to mark
 * it applied.
 *
 * Some migrations are authored against an empty database. `ADD COLUMN "x" TEXT
 * NOT NULL` with no default is the usual case: Postgres must write a value
 * into every existing row, so it fails with 23502 the moment the table has
 * data. Prisma flags this in the migration header — "This is not possible if
 * the table is not empty" — and there is no way to make `migrate deploy` do
 * anything different.
 *
 * The fix is to run the same statements with a temporary default, then drop
 * the default. The end state is identical to what the migration describes:
 * NOT NULL, no default, existing rows backfilled with an empty value.
 *
 *   node scripts/apply-migration-manually.mjs 20250913044934_renamed_field
 *   node scripts/apply-migration-manually.mjs 20250913044934_renamed_field --apply
 *
 * Afterwards:
 *   npx prisma migrate resolve --applied <name>
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const NAME = args.find((a) => !a.startsWith("--"));

if (!NAME) {
  console.error("Usage: node scripts/apply-migration-manually.mjs <migration-name> [--apply]");
  process.exit(1);
}

const file = path.resolve(process.cwd(), "prisma", "migrations", NAME, "migration.sql");
if (!fs.existsSync(file)) {
  console.error(`No migration.sql at ${file}`);
  process.exit(1);
}

/** Backfill values by column type. Anything unlisted is refused rather than guessed. */
const ZERO = [
  [/\bTEXT\b|\bVARCHAR\b|\bCHAR\b/i, "''"],
  [/\bINTEGER\b|\bBIGINT\b|\bSMALLINT\b|\bDECIMAL\b|\bDOUBLE\b|\bREAL\b/i, "0"],
  [/\bBOOLEAN\b/i, "false"],
  [/\bTIMESTAMP\b|\bDATE\b/i, "CURRENT_TIMESTAMP"],
];

try {
  const raw = fs.readFileSync(file, "utf8");

  if (raw.includes("$$")) {
    console.error(
      "This migration contains a dollar-quoted block; splitting it on ';' would\n" +
        "corrupt it. Apply this one by hand."
    );
    process.exit(1);
  }

  const sql = raw.replace(/--[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const counts = new Map();
  const rowCount = async (table) => {
    if (counts.has(table)) return counts.get(table);
    const r = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "${table.replace(/"/g, '""')}"`
    );
    counts.set(table, r[0]?.n ?? 0);
    return counts.get(table);
  };

  const planned = [];
  const followUps = [];
  const notes = [];

  for (const stmt of statements) {
    const flat = stmt.replace(/\s+/g, " ");
    const alter = flat.match(/^ALTER TABLE "([^"]+)" (.+)$/i);
    if (!alter) {
      planned.push(stmt);
      continue;
    }

    const table = alter[1];
    const actions = alter[2].split(/,\s*(?=ADD |DROP |ALTER |RENAME )/i);
    const rewritten = [];

    for (const action of actions) {
      const add = action.match(/^ADD COLUMN "([^"]+)" (.+)$/i);
      const needsBackfill =
        add && /\bNOT NULL\b/i.test(action) && !/\bDEFAULT\b/i.test(action);

      if (!needsBackfill) {
        rewritten.push(action);
        continue;
      }

      const column = add[1];
      const n = await rowCount(table);
      if (n === 0) {
        rewritten.push(action);
        notes.push(`"${table}" is empty — "${column}" needs no backfill`);
        continue;
      }

      const type = add[2];
      const zero = ZERO.find(([re]) => re.test(type))?.[1];
      if (!zero) {
        console.error(
          `\nCan't pick a backfill value for "${table}"."${column}" of type ${type}.\n` +
            "Add it to the ZERO table in this script, or apply by hand.\n"
        );
        process.exit(1);
      }

      rewritten.push(`${action} DEFAULT ${zero}`);
      followUps.push(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT`
      );
      notes.push(
        `"${table}"."${column}": NOT NULL with no default, ${n} existing row(s) ` +
          `backfilled with ${zero}, default then dropped`
      );
    }

    planned.push(`ALTER TABLE "${table}" ${rewritten.join(", ")}`);
  }

  const all = [...planned, ...followUps];

  console.log(`\n=== ${NAME} — ${all.length} statement(s) ===\n`);
  for (const s of all) {
    console.log("  " + s.replace(/\s+/g, " ").slice(0, 150));
  }

  if (notes.length) {
    console.log(`\n=== REWRITES (${notes.length}) ===`);
    for (const n of notes) console.log("  " + n);
    console.log(
      "\n  End state matches the migration exactly: NOT NULL, no default.\n" +
        "  Existing rows get an empty value — review them afterwards if the\n" +
        "  column is meant to hold something meaningful."
    );
  } else {
    console.log("\n  No rewrites needed — this migration would apply as written.");
  }

  if (!APPLY) {
    console.log("\nDry run. Rerun with --apply.\n");
    process.exit(0);
  }

  // One transaction: either the whole migration lands or none of it does.
  await prisma.$transaction(all.map((s) => prisma.$executeRawUnsafe(s)));

  console.log(`\nApplied ${all.length} statement(s).\n`);
  console.log("Now tell Prisma it's done, so it stops trying to run it:\n");
  console.log(`  npx prisma migrate resolve --applied ${NAME}`);
  console.log(`  npx prisma generate`);
  console.log(`  node scripts/migration-preflight.mjs\n`);
} catch (e) {
  console.error("\nFailed:", e?.message ?? e);
  console.error("\nNothing was committed — the statements run in one transaction.\n");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
