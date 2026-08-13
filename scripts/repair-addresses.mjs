#!/usr/bin/env node
/**
 * Undoes a duplicate address schema.
 *
 * An earlier branch added six-part address columns (House / Street / Village /
 * Commune / District / Province) without noticing that main already stored
 * addresses as `<prefix>Address` free text plus City / District / Commune /
 * Village — and then dropped several of main's columns. The forms write to
 * main's names, so they are currently broken.
 *
 * This recreates main's columns, copies the data across, and drops the
 * duplicates. It is a repair, not a migration: a database built purely from
 * prisma/migrations never had the duplicate columns, so there is nothing for
 * it to fix.
 *
 *   node scripts/repair-addresses.mjs           # report what it would do
 *   node scripts/repair-addresses.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const q = (s) => `"${s.replace(/"/g, '""')}"`;

/**
 * House and Street collapse into one free-text field; Province becomes City.
 * `notNull` marks columns schema.prisma declares required — those need a
 * temporary default so the ALTER succeeds on a table that already has rows.
 */
const PLAN = [
  {
    table: "Client_PersonalInformation",
    targets: [
      { col: "homeBA", notNull: true, from: ["currentAddressHouse"] },
      { col: "StreetBA", notNull: true, from: ["currentAddressStreet"] },
      { col: "villageBA", notNull: true, from: ["currentAddressVillage"] },
      { col: "communeBA", notNull: true, from: ["currentAddressCommune"] },
      { col: "districtBA", notNull: true, from: ["currentAddressDistrict"] },
      { col: "cityProBA", notNull: true, from: ["currentAddressProvince"] },
    ],
    drop: [
      "currentAddressHouse", "currentAddressStreet", "currentAddressVillage",
      "currentAddressCommune", "currentAddressDistrict", "currentAddressProvince",
    ],
  },
  {
    table: "ServiceCenter",
    targets: [
      // main has no Commune here, so it is folded into the free-text Address
      // rather than dropped — losing the structure is unavoidable, losing the
      // information is not.
      { col: "Address", from: ["addressHouse", "addressStreet", "addressCommune"] },
      { col: "City", from: ["addressProvince"] },
      { col: "District", from: ["addressDistrict"] },
      { col: "Village", from: ["addressVillage"] },
    ],
    drop: [
      "addressHouse", "addressStreet", "addressVillage",
      "addressCommune", "addressDistrict", "addressProvince",
    ],
  },
  {
    table: "Staff",
    targets: [
      { col: "currentAddress", from: ["currentAddressHouse", "currentAddressStreet"] },
      { col: "currentCity", from: ["currentAddressProvince"] },
      { col: "currentDistrict", from: ["currentAddressDistrict"] },
      { col: "currentCommune", from: ["currentAddressCommune"] },
      { col: "currentVillage", from: ["currentAddressVillage"] },
      { col: "familyAddress", from: ["familyAddressHouse", "familyAddressStreet"] },
      { col: "familyAddressCity", from: ["familyAddressProvince"] },
    ],
    drop: [
      "currentAddressHouse", "currentAddressStreet", "currentAddressVillage",
      "currentAddressCommune", "currentAddressDistrict", "currentAddressProvince",
      "familyAddressHouse", "familyAddressStreet", "familyAddressProvince",
    ],
  },
  {
    table: "governStaff",
    targets: [
      { col: "currentAddress", from: ["currentAddressHouse", "currentAddressStreet"] },
      { col: "currentCity", from: ["currentAddressProvince"] },
      { col: "currentDistrict", from: ["currentAddressDistrict"] },
      { col: "currentCommune", from: ["currentAddressCommune"] },
      { col: "currentVillage", from: ["currentAddressVillage"] },

      { col: "permanentAddress", from: ["permanentAddressHouse", "permanentAddressStreet"] },
      { col: "permanentCity", from: ["permanentAddressProvince"] },
      { col: "permanentDistrict", from: ["permanentAddressDistrict"] },
      { col: "permanentCommune", from: ["permanentAddressCommune"] },
      { col: "permanentVillage", from: ["permanentAddressVillage"] },

      // Case matters: main's "ECAddress*" vs the duplicate "ecAddress*".
      { col: "ECAddress", notNull: true, from: ["ecAddressHouse", "ecAddressStreet"] },
      { col: "ECAddressCity", from: ["ecAddressProvince"] },
      { col: "ECAddressDistrict", from: ["ecAddressDistrict"] },
      { col: "ECAddressCommune", from: ["ecAddressCommune"] },
      { col: "ECAddressVillage", from: ["ecAddressVillage"] },

      // main spells it "spuse"; the duplicate spells it "spouse".
      { col: "spuseCurrentAddress", from: ["spouseCurrentAddressHouse", "spouseCurrentAddressStreet"] },
      { col: "spuseCurrentAddressCity", from: ["spouseCurrentAddressProvince"] },
      { col: "spuseCurrentAddressDistrict", from: ["spouseCurrentAddressDistrict"] },
      { col: "spuseCurrentAddressCommune", from: ["spouseCurrentAddressCommune"] },
      { col: "spuseCurrentAddressVillage", from: ["spouseCurrentAddressVillage"] },
    ],
    drop: [
      "currentAddressHouse", "currentAddressStreet", "currentAddressVillage",
      "currentAddressCommune", "currentAddressDistrict", "currentAddressProvince",
      "permanentAddressHouse", "permanentAddressStreet", "permanentAddressVillage",
      "permanentAddressCommune", "permanentAddressDistrict", "permanentAddressProvince",
      "ecAddressHouse", "ecAddressStreet", "ecAddressVillage",
      "ecAddressCommune", "ecAddressDistrict", "ecAddressProvince",
      "spouseCurrentAddressHouse", "spouseCurrentAddressStreet", "spouseCurrentAddressVillage",
      "spouseCurrentAddressCommune", "spouseCurrentAddressDistrict", "spouseCurrentAddressProvince",
    ],
  },
];

try {
  const cols = await prisma.$queryRawUnsafe(
    `SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public'`
  );
  const has = new Set(cols.map((c) => `${c.table_name}.${c.column_name}`));

  const creates = [];
  const defaults = [];
  const updates = [];
  const drops = [];
  const report = [];
  const skipped = [];

  for (const spec of PLAN) {
    const t = spec.table;
    const n = (
      await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM ${q(t)}`)
    )[0].n;
    report.push(`\n  ${t}  (${n} row${n === 1 ? "" : "s"})`);

    const sets = [];
    for (const target of spec.targets) {
      const sources = target.from.filter((f) => has.has(`${t}.${f}`));
      if (sources.length === 0) {
        // Nothing to copy from; only create the column if it's missing.
        if (!has.has(`${t}.${target.col}`)) {
          creates.push(
            `ALTER TABLE ${q(t)} ADD COLUMN ${q(target.col)} TEXT${target.notNull ? " NOT NULL DEFAULT ''" : ""}`
          );
          if (target.notNull)
            defaults.push(
              `ALTER TABLE ${q(t)} ALTER COLUMN ${q(target.col)} DROP DEFAULT`
            );
          report.push(`      + ${target.col}  (created empty — no source column)`);
        } else {
          skipped.push(`${t}.${target.col}`);
        }
        continue;
      }

      if (!has.has(`${t}.${target.col}`)) {
        creates.push(
          `ALTER TABLE ${q(t)} ADD COLUMN ${q(target.col)} TEXT${target.notNull ? " NOT NULL DEFAULT ''" : ""}`
        );
        if (target.notNull)
          defaults.push(
            `ALTER TABLE ${q(t)} ALTER COLUMN ${q(target.col)} DROP DEFAULT`
          );
      }

      // Join the parts, skipping blanks, and only write where the target is
      // still empty — never overwrite a value main's forms already saved.
      const parts = sources.map((s) => `NULLIF(${q(s)}, '')`).join(", ");
      const value =
        sources.length > 1 ? `NULLIF(concat_ws(', ', ${parts}), '')` : parts;
      sets.push(
        `${q(target.col)} = COALESCE(NULLIF(${q(target.col)}, ''), ${value})`
      );
      report.push(`      ${target.col.padEnd(28)} <- ${sources.join(" + ")}`);
    }

    if (sets.length)
      updates.push(`UPDATE ${q(t)} SET ${sets.join(", ")}`);

    for (const d of spec.drop) {
      if (has.has(`${t}.${d}`)) {
        drops.push(`ALTER TABLE ${q(t)} DROP COLUMN ${q(d)}`);
      }
    }
    const present = spec.drop.filter((d) => has.has(`${t}.${d}`));
    if (present.length)
      report.push(`      drop ${present.length}: ${present.join(", ")}`);
  }

  console.log("=== PLAN ===");
  for (const line of report) console.log(line);
  if (skipped.length) {
    console.log(
      `\n  Already correct, left alone: ${skipped.length} column(s)`
    );
  }
  console.log(
    `\n  ${creates.length} column(s) to create, ${updates.length} table(s) to backfill, ${drops.length} column(s) to drop`
  );

  if (drops.length === 0 && creates.length === 0) {
    console.log("\nNothing to repair — this database has no duplicate columns.\n");
    process.exit(0);
  }

  if (!APPLY) {
    console.log("\nDry run. Rerun with --apply.\n");
    process.exit(0);
  }

  // Order matters: create, backfill, then drop. One transaction, so a failure
  // can't leave the data copied but the source columns already gone.
  const all = [...creates, ...updates, ...defaults, ...drops];
  await prisma.$transaction(all.map((s) => prisma.$executeRawUnsafe(s)));

  console.log(`\nApplied ${all.length} statement(s).\n`);
  console.log("Next:\n  npx prisma generate\n  npx prisma migrate deploy\n");
} catch (e) {
  console.error("\nFailed:", e?.message ?? e);
  console.error("Nothing was committed — it runs in one transaction.\n");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
