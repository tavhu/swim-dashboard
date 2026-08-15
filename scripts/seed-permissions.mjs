#!/usr/bin/env node
/**
 * Creates the `Resources` rows that the server-side policy expects but the
 * database does not have yet, and optionally grants them to roles.
 *
 * Background: `server/utils/policy.ts` keys every endpoint to a resource by
 * `Resources.frontEndURL`. The policy fails closed, so a resource with no row
 * denies everyone — including the ministry admin. Features added since the
 * original permission grid was built (organisation, service, centre plans)
 * have endpoints but no resource row.
 *
 * Non-destructive by default:
 *   - reports what it would do and changes nothing unless `--apply`
 *   - creates rows only; never edits an existing resource or grant
 *   - `--force` re-points frontEndURL on an existing row (rarely needed)
 *
 * Usage:
 *   node scripts/seed-permissions.mjs                        # dry run
 *   node scripts/seed-permissions.mjs --mirror --corrections # full preview
 *   node scripts/seed-permissions.mjs --apply --mirror --corrections
 *   node scripts/seed-permissions.mjs --apply --grant-to="Admin"
 *
 * `--corrections` also *reduces* one existing grant — see CORRECTIONS below.
 * It is the only part of this script that takes permission away, which is why
 * it is opt-in.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FORCE = args.includes("--force");
const MIRROR = args.includes("--mirror");
const CORRECTIONS_ON = args.includes("--corrections");
const GRANT_TO = args
  .filter((a) => a.startsWith("--grant-to="))
  .map((a) => a.slice("--grant-to=".length).replace(/^["']|["']$/g, ""));

/**
 * Deliberate changes to grants that already exist.
 *
 * Everything else in this script only ever creates. These entries *reduce* an
 * existing permission, so they are opt-in (`--corrections`) and each one only
 * fires when the current state still matches `from` — rerunning is a no-op,
 * and a grant you have since edited by hand is left alone.
 *
 * They run before the mirroring below, so mirrored resources inherit the
 * corrected value rather than the mistake.
 */
const CORRECTIONS = [
  {
    role: "មន្រីឃុំសង្កាត់",
    resource: "center",
    from: { granted: true },
    to: { read: true, granted: false },
    why:
      "Sangkat officials do intake, not centre administration. Write on `center` " +
      "let them create and edit service centres, and would have been mirrored " +
      "onto organisation and service.",
  },
];

/**
 * Resources the policy references. `mirror` names an existing resource whose
 * grants are a sensible starting point: whoever may edit a centre should be
 * able to edit that centre's organisation, services and plans.
 */
const REQUIRED = [
  {
    frontEndURL: "organisation",
    name: "អង្គភាព",
    backEndURL: "/api/organisation",
    mirror: "center",
  },
  {
    frontEndURL: "service",
    name: "សេវាកម្ម",
    backEndURL: "/api/service",
    mirror: "center",
  },
  {
    frontEndURL: "center-plan",
    name: "ផែនការមណ្ឌល",
    backEndURL: "/api/center/plan",
    // Deliberately not "center". `center` is the *create a centre* permission,
    // held by Super Admin and មន្រីឃុំសង្កាត់ — but not by ប្រធានមជ្ឈមណ្ឌល, who is
    // the person a centre's own plan belongs to. `center-staff` has the right
    // shape: Super Admin, Admin and ប្រធានមជ្ឈមណ្ឌល write, បុគ្គលិកមណ្ឌល read.
    mirror: "center-staff",
  },
  // ប្រភេទអតិថិជន is a reference list of the same kind as សេវា, maintained by the
  // same people and feeding the same ទម្រង់ទី២ dropdowns, so `service` is the
  // right shape to start from. Two rows because the permission grid, the route
  // guard and the sidebar all key on the page's route name: `/client-type` is
  // `client-type` and `/client-type/register` is `client-type-register` — which
  // is exactly how សេវា already has both `service` and `service-register`.
  {
    frontEndURL: "client-type",
    name: "បញ្ចី ប្រភេទអតិថិជន",
    backEndURL: "/api/client-type",
    mirror: "service",
  },
  {
    frontEndURL: "client-type-register",
    name: "បង្កើត ប្រភេទអតិថិជន",
    backEndURL: "/api/client-type/upsert",
    mirror: "service-register",
  },
];

/** Every resource key the policy expects to find, for the coverage report. */
const POLICY_KEYS = [
  "client",
  "client-register",
  "center",
  "center-list",
  "center-staff",
  "contact-list",
  "role",
  "register",
  "register-account",
  "file",
  "approval",
  "organisation",
  "service",
  "center-plan",
  "client-type",
  "client-type-register",
];

const plan = [];
const note = (s) => plan.push(s);

try {
  const [resources, roles] = await Promise.all([
    prisma.resources.findMany({
      select: { id: true, name: true, frontEndURL: true },
    }),
    prisma.role.findMany({ select: { id: true, name: true } }),
  ]);

  const byURL = new Map(resources.map((r) => [r.frontEndURL, r]));
  const byName = new Map(resources.map((r) => [r.name, r]));

  // --- 1. report which policy keys have no row --------------------------
  const missingKeys = POLICY_KEYS.filter((k) => !byURL.has(k));
  console.log(`\n=== POLICY KEYS WITHOUT A RESOURCE ROW (${missingKeys.length}) ===`);
  if (missingKeys.length === 0) console.log("  none");
  for (const k of missingKeys) {
    const fixable = REQUIRED.some((r) => r.frontEndURL === k);
    console.log(`  ${k}${fixable ? "" : "   <- not created by this script"}`);
  }
  const unfixable = missingKeys.filter(
    (k) => !REQUIRED.some((r) => r.frontEndURL === k)
  );
  if (unfixable.length) {
    console.log(
      "\n  Those keys deny everyone while the policy is enforced. Either add a\n" +
        "  Resources row with that frontEndURL, or correct the key in\n" +
        "  server/utils/policy.ts to match what the database actually uses."
    );
  }

  // --- 2. corrections to existing grants ---------------------------------
  // Must run before mirroring, or the mirror copies the uncorrected value.
  const roleByNameEarly = new Map(roles.map((r) => [r.name, r]));
  /** `${roleID}:${resourceID}` -> corrected {read, granted}. */
  const corrected = new Map();
  for (const fix of CORRECTIONS) {
    if (!CORRECTIONS_ON) {
      note(
        `(skip) correction available: ${fix.role} -> ${fix.resource} ` +
          `${JSON.stringify(fix.to)} — rerun with --corrections to include it`
      );
      continue;
    }

    const role = roleByNameEarly.get(fix.role);
    const resource = byURL.get(fix.resource);
    if (!role || !resource) {
      note(`SKIP   correction ${fix.role} -> ${fix.resource} (role or resource missing)`);
      continue;
    }

    const current = await prisma.roleToResource.findUnique({
      where: { roleID_resourceID: { roleID: role.id, resourceID: resource.id } },
      select: { read: true, granted: true },
    });
    if (!current) {
      note(`skip   correction ${fix.role} -> ${fix.resource} (no grant to change)`);
      continue;
    }

    const matches = Object.entries(fix.from).every(
      ([k, v]) => current[k] === v
    );
    if (!matches) {
      note(
        `skip   correction ${fix.role} -> ${fix.resource} (already changed: ` +
          `read=${current.read} write=${current.granted})`
      );
      continue;
    }

    note(
      `CHANGE ${fix.role} -> ${fix.resource}  ` +
        `read=${current.read} write=${current.granted}  ==>  ` +
        `read=${fix.to.read} write=${fix.to.granted}`
    );
    note(`       reason: ${fix.why}`);
    // Record it either way, so a dry run's mirror preview reflects the
    // corrected value rather than the mistake it is about to fix.
    corrected.set(`${role.id}:${resource.id}`, fix.to);
    if (APPLY) {
      await prisma.roleToResource.update({
        where: { roleID_resourceID: { roleID: role.id, resourceID: resource.id } },
        data: fix.to,
      });
    }
  }

  // --- 3. create the missing rows ---------------------------------------
  for (const want of REQUIRED) {
    const existingByURL = byURL.get(want.frontEndURL);
    if (existingByURL) {
      note(`skip   resource ${want.frontEndURL} (already exists)`);
      continue;
    }

    // `name` is unique — a row may exist under this name with a different or
    // empty frontEndURL, in which case creating would throw.
    const clash = byName.get(want.name);
    if (clash) {
      if (!FORCE) {
        note(
          `SKIP   resource "${want.name}" exists with frontEndURL=` +
            `${JSON.stringify(clash.frontEndURL)} — rerun with --force to re-point it to "${want.frontEndURL}"`
        );
        continue;
      }
      note(`update resource "${want.name}" frontEndURL -> ${want.frontEndURL}`);
      if (APPLY) {
        const row = await prisma.resources.update({
          where: { id: clash.id },
          data: { frontEndURL: want.frontEndURL, backEndURL: want.backEndURL },
        });
        byURL.set(want.frontEndURL, row);
      }
      continue;
    }

    note(`create resource ${want.frontEndURL}  (${want.name})`);
    if (APPLY) {
      const row = await prisma.resources.create({
        data: {
          name: want.name,
          frontEndURL: want.frontEndURL,
          backEndURL: want.backEndURL,
        },
        select: { id: true, name: true, frontEndURL: true },
      });
      byURL.set(want.frontEndURL, row);
      byName.set(row.name, row);
    }
  }

  // --- 4. grants ---------------------------------------------------------
  const roleByName = new Map(roles.map((r) => [r.name, r]));
  for (const name of GRANT_TO) {
    if (!roleByName.has(name)) {
      note(
        `SKIP   --grant-to="${name}" — no such role. Roles: ${roles
          .map((r) => r.name)
          .join(", ")}`
      );
    }
  }

  for (const want of REQUIRED) {
    // On a dry run the row does not exist yet, but the grants it *would*
    // receive are the whole point of previewing — work them out anyway and
    // skip only the per-grant "already set?" lookup.
    const resource = byURL.get(want.frontEndURL);
    if (!resource && APPLY) {
      note(`skip   grants for ${want.frontEndURL} (row not created)`);
      continue;
    }

    /** roleID -> {read, granted} */
    const targets = new Map();

    if (MIRROR) {
      const source = byURL.get(want.mirror);
      if (!source) {
        note(`SKIP   --mirror ${want.mirror} for ${want.frontEndURL} — no such resource`);
      } else {
        const rows = await prisma.roleToResource.findMany({
          where: { resourceID: source.id },
          select: { roleID: true, read: true, granted: true },
        });
        for (const r of rows) {
          const fixed = corrected.get(`${r.roleID}:${source.id}`);
          const read = fixed ? fixed.read : r.read;
          const granted = fixed ? fixed.granted : r.granted;
          if (!read && !granted) continue;
          targets.set(r.roleID, { read, granted });
        }
      }
    }

    for (const name of GRANT_TO) {
      const role = roleByName.get(name);
      if (role) targets.set(role.id, { read: true, granted: true });
    }

    for (const [roleID, perm] of targets) {
      const existing = resource
        ? await prisma.roleToResource.findUnique({
            where: { roleID_resourceID: { roleID, resourceID: resource.id } },
            select: { read: true, granted: true },
          })
        : null;
      const roleName = roles.find((r) => r.id === roleID)?.name ?? roleID;

      if (existing) {
        note(
          `skip   grant ${roleName} -> ${want.frontEndURL} (already set: ` +
            `read=${existing.read} write=${existing.granted})`
        );
        continue;
      }

      note(
        `grant  ${roleName} -> ${want.frontEndURL}  read=${perm.read} write=${perm.granted}` +
          (MIRROR ? `  (mirrored from ${want.mirror})` : "")
      );
      if (APPLY && resource) {
        await prisma.roleToResource.create({
          data: { roleID, resourceID: resource.id, ...perm },
        });
      }
    }

    if (targets.size === 0) {
      note(
        `note   ${want.frontEndURL} has no grants — every role is denied. ` +
          `Use --mirror or --grant-to="<role>".`
      );
    }
  }

  console.log(`\n=== PLAN (${plan.length}) ===`);
  for (const line of plan) console.log("  " + line);

  console.log(
    APPLY
      ? "\nApplied.\n"
      : "\nDry run — nothing was written. Rerun with --apply to make these changes.\n"
  );
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
