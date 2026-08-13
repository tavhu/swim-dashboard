#!/usr/bin/env node
/**
 * Dry-runs the pending migrations against the *actual* database shape.
 *
 * `prisma migrate status` tells you which migrations haven't run. It does not
 * tell you whether they still *can* — and when a database has been through a
 * different migration history, plenty of them can't: dropping a column that is
 * already gone, or adding one that already exists, both abort the migration
 * and leave it half applied.
 *
 * This reads each pending migration's SQL, compares it against
 * information_schema, and reports which statements would fail. Read-only.
 *
 *   node scripts/migration-preflight.mjs
 */
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
const MIGRATIONS = path.resolve(process.cwd(), "prisma", "migrations");

/** Statements this script understands. Anything else is reported as unknown. */
function parse(sql) {
  const out = [];
  // Strip comments, collapse to single statements.
  const clean = sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  for (const raw of clean.split(";")) {
    const stmt = raw.trim().replace(/\s+/g, " ");
    if (!stmt) continue;

    const createTable = stmt.match(/^CREATE TABLE (IF NOT EXISTS )?"([^"]+)"/i);
    if (createTable) {
      out.push({
        kind: "create-table",
        table: createTable[2],
        guarded: !!createTable[1],
        stmt,
      });
      continue;
    }

    const alter = stmt.match(/^ALTER TABLE "([^"]+)" (.+)$/i);
    if (alter) {
      const table = alter[1];
      // One ALTER can carry several comma-separated actions.
      const actions = alter[2].split(/,\s*(?=ADD |DROP |ALTER |RENAME )/i);
      for (const action of actions) {
        // `guarded` records an IF EXISTS / IF NOT EXISTS clause. Without one,
        // Postgres raises 42703 rather than shrugging — so whether the clause
        // is present decides failure vs. no-op, and must be tracked.
        const add = action.match(/^ADD COLUMN (IF NOT EXISTS )?"([^"]+)"/i);
        if (add) {
          out.push({
            kind: "add-column",
            table,
            column: add[2],
            guarded: !!add[1],
            stmt: action,
          });
          continue;
        }
        const drop = action.match(/^DROP COLUMN (IF EXISTS )?"([^"]+)"/i);
        if (drop) {
          out.push({
            kind: "drop-column",
            table,
            column: drop[2],
            guarded: !!drop[1],
            stmt: action,
          });
          continue;
        }
        // ALTER COLUMN … DROP NOT NULL / SET NOT NULL / SET DATA TYPE.
        // Missing this is what let 20241015080839_ be reported "ok" when it
        // could not run: it drops NOT NULL on a column another migration had
        // already removed.
        const alterCol = action.match(/^ALTER COLUMN "([^"]+)"/i);
        if (alterCol) {
          out.push({
            kind: "alter-column",
            table,
            column: alterCol[1],
            stmt: action,
          });
          continue;
        }

        const rename = action.match(
          /^RENAME COLUMN "([^"]+)" TO "([^"]+)"/i
        );
        if (rename) {
          out.push({
            kind: "rename-column",
            table,
            column: rename[1],
            to: rename[2],
            stmt: action,
          });
          continue;
        }
        out.push({ kind: "other", table, stmt: action });
      }
      continue;
    }
    out.push({ kind: "other", stmt });
  }
  return out;
}

try {
  // --- current shape -------------------------------------------------------
  const cols = await prisma.$queryRawUnsafe(
    `SELECT table_name, column_name FROM information_schema.columns
     WHERE table_schema = 'public'`
  );
  const tables = new Set(cols.map((c) => c.table_name));
  const columns = new Set(cols.map((c) => `${c.table_name}.${c.column_name}`));
  // Tables that exist *now*. Tables a migration creates are empty by
  // definition, so a NOT NULL column added to one of those is fine.
  const preExisting = new Set(tables);

  const countCache = new Map();
  const rowCount = async (table) => {
    if (countCache.has(table)) return countCache.get(table);
    const r = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS n FROM "${table.replace(/"/g, '""')}"`
    );
    const n = r[0]?.n ?? 0;
    countCache.set(table, n);
    return n;
  };

  // --- which migrations have run ------------------------------------------
  const applied = new Set(
    (
      await prisma.$queryRawUnsafe(
        `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`
      )
    ).map((r) => r.migration_name)
  );

  const onDisk = fs
    .readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const pending = onDisk.filter((m) => !applied.has(m));
  const ghost = [...applied].filter((m) => !onDisk.includes(m)).sort();

  console.log(`\n=== APPLIED BUT NOT ON THIS BRANCH (${ghost.length}) ===`);
  for (const m of ghost) console.log(`  ${m}`);
  if (ghost.length) {
    console.log(
      "\n  These changed the database but their SQL isn't in this branch, which\n" +
        "  is why the pending migrations below may no longer fit."
    );
  }

  console.log(`\n=== PENDING MIGRATIONS (${pending.length}) ===`);

  let willFail = 0;
  let noop = 0;
  for (const name of pending) {
    const file = path.join(MIGRATIONS, name, "migration.sql");
    if (!fs.existsSync(file)) {
      console.log(`\n  ${name}\n      (no migration.sql)`);
      continue;
    }
    const stmts = parse(fs.readFileSync(file, "utf8"));
    const problems = [];
    const redundant = [];

    for (const s of stmts) {
      switch (s.kind) {
        case "create-table":
          if (tables.has(s.table)) {
            if (s.guarded) redundant.push(`table "${s.table}" already exists`);
            else problems.push(`table "${s.table}" already exists`);
          } else tables.add(s.table);
          break;
        case "add-column":
          if (columns.has(`${s.table}.${s.column}`)) {
            if (s.guarded)
              redundant.push(`"${s.table}"."${s.column}" already exists`);
            else problems.push(`"${s.table}"."${s.column}" already exists`);
          } else if (!tables.has(s.table))
            problems.push(`table "${s.table}" does not exist`);
          else {
            columns.add(`${s.table}.${s.column}`);
            // Postgres has to write a value into every existing row. NOT NULL
            // with no DEFAULT therefore fails with 23502 unless the table is
            // empty — Prisma even warns about this in the migration header,
            // because such a migration only ever ran against an empty table.
            if (
              /\bNOT NULL\b/i.test(s.stmt) &&
              !/\bDEFAULT\b/i.test(s.stmt) &&
              preExisting.has(s.table)
            ) {
              const n = await rowCount(s.table);
              if (n > 0)
                problems.push(
                  `"${s.table}"."${s.column}" is NOT NULL with no DEFAULT and "${s.table}" has ${n} row(s)`
                );
            }
          }
          break;
        case "drop-column":
          if (!tables.has(s.table))
            problems.push(`table "${s.table}" does not exist`);
          else if (!columns.has(`${s.table}.${s.column}`)) {
            // Postgres raises 42703 here unless the statement says IF EXISTS.
            // Reporting this as merely "redundant" is what let
            // 20250913044934_renamed_field through as safe.
            if (s.guarded)
              redundant.push(`"${s.table}"."${s.column}" is already gone`);
            else
              problems.push(
                `"${s.table}"."${s.column}" is already gone (DROP COLUMN without IF EXISTS)`
              );
          } else columns.delete(`${s.table}.${s.column}`);
          break;
        case "alter-column":
          if (!tables.has(s.table))
            problems.push(`table "${s.table}" does not exist`);
          else if (!columns.has(`${s.table}.${s.column}`))
            problems.push(
              `"${s.table}"."${s.column}" does not exist (${s.stmt.slice(0, 60)})`
            );
          break;
        case "rename-column":
          if (!columns.has(`${s.table}.${s.column}`))
            problems.push(
              `"${s.table}"."${s.column}" does not exist (rename to "${s.to}")`
            );
          else {
            columns.delete(`${s.table}.${s.column}`);
            columns.add(`${s.table}.${s.to}`);
          }
          break;
      }
    }

    const verdict = problems.length
      ? "WOULD FAIL"
      : redundant.length
        ? "would apply (some statements redundant)"
        : "ok";
    if (problems.length) willFail++;
    if (!problems.length && redundant.length) noop++;

    console.log(`\n  ${name}  —  ${verdict}`);
    for (const p of problems) console.log(`      FAIL: ${p}`);
    for (const r of redundant) console.log(`      note: ${r}`);
  }

  console.log(
    `\n=== SUMMARY ===\n  ${pending.length} pending, ${willFail} would fail, ${noop} would apply with redundant statements\n`
  );
  if (willFail) {
    console.log(
      "  `prisma migrate deploy` stops at the first failure and leaves that\n" +
        "  migration half applied. Back up before attempting it.\n"
    );
  }
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
