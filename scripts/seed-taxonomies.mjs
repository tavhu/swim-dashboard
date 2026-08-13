#!/usr/bin/env node
/**
 * Seeds the rehabilitation taxonomy from the SWIMS manual.
 *
 * The manual enumerates seven ក្រុមស្តារនីតិសម្បទា and, for three of them, the
 * activities underneath. Those are reproduced verbatim here; anything the
 * manual does not list is left for the ministry to add through the UI.
 *
 * Codes: the manual marks លេខកូដ as required on types but does not say what the
 * ministry's codes are. The ones generated here are positional placeholders
 * (RH-1, RH-1-1 …) and are meant to be corrected once the real codes are known
 * — they are only unique handles, nothing keys off their shape.
 *
 * Non-destructive:
 *   - reports what it would do and changes nothing unless `--apply`
 *   - creates only; never edits or deletes an existing row
 *   - safe to re-run: matches on Khmer name within the parent
 *
 * Usage:
 *   node scripts/seed-taxonomies.mjs            # dry run
 *   node scripts/seed-taxonomies.mjs --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

// Verbatim from the manual's rehabilitation-service list. English names are
// working translations — the spec requires both languages but supplies only
// Khmer here, so these should be reviewed.
const GROUPS = [
  {
    nameKh: "ស្តារផ្នែកតម្រូវការមូលដ្ឋាន",
    nameEn: "Basic needs",
    types: ["អាហារ", "ស្នាក់នៅ", "សំលៀកបំពាក់", "ថ្នាំសង្កូវ"],
  },
  {
    nameKh: "ស្តារសេដ្ឋកិច្ច",
    nameEn: "Economic",
    types: ["វិជ្ជាជីវៈ", "ការងារនិងមុខរបរ", "កម្ចី", "ជំនួយសង្គម", "ប្រឹក្សាផ្នែកហិរញ្ញវត្ថុ"],
  },
  {
    nameKh: "ស្តារផ្លូវច្បាប់",
    nameEn: "Legal",
    types: ["អប់រំកែប្រែ", "លើកលែងទោស ឬបន្ធូបន្ថយ", "សេវាបង្វែរ", "ប្រឹក្សាផ្នែកច្បាប់", "ជំនួយផ្នែកច្បាប់"],
  },
  { nameKh: "ស្តារគ្រឿងញៀននិងគ្រឿងស្រវឹង", nameEn: "Drug and alcohol", types: [] },
  { nameKh: "ព្យាបាលផ្លូវចិត្តនិងវិប្លាសស្មារតី", nameEn: "Mental health", types: [] },
  { nameKh: "ស្តារកាយសម្បទា", nameEn: "Physical rehabilitation", types: [] },
  { nameKh: "ស្តារវេជ្ជសាស្រ្ត", nameEn: "Medical", types: ["សុខភាពផ្លូវកាយ"] },
];

const plan = [];

try {
  for (const [gi, g] of GROUPS.entries()) {
    let group = await prisma.rehabGroup.findFirst({
      where: { nameKh: g.nameKh },
      select: { id: true },
    });

    if (!group) {
      plan.push(`create group   ${g.nameKh}`);
      if (APPLY) {
        group = await prisma.rehabGroup.create({
          data: { nameKh: g.nameKh, nameEn: g.nameEn },
          select: { id: true },
        });
      }
    }

    for (const [ti, nameKh] of g.types.entries()) {
      // Without the group there is nothing to attach to on a dry run.
      if (!group) {
        plan.push(`  create type  ${nameKh}  (under a group that does not exist yet)`);
        continue;
      }
      const existing = await prisma.rehabType.findFirst({
        where: { nameKh, groupId: group.id },
        select: { id: true },
      });
      if (existing) continue;

      plan.push(`  create type  ${nameKh}`);
      if (APPLY) {
        await prisma.rehabType.create({
          data: {
            code: `RH-${gi + 1}-${ti + 1}`,
            groupId: group.id,
            nameKh,
          },
        });
      }
    }
  }

  if (plan.length === 0) {
    console.log("Nothing to do — the taxonomy is already seeded.");
  } else {
    console.log(plan.join("\n"));
    console.log(
      APPLY
        ? `\nApplied ${plan.length} change(s).`
        : `\n${plan.length} change(s) would be made. Re-run with --apply to write them.`
    );
  }
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
