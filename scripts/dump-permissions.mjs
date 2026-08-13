#!/usr/bin/env node
/**
 * Prints the permission configuration so the server-side authorization layer
 * can be planned against real data.
 *
 * The layer fails closed: an endpoint whose resource row is missing denies
 * everyone. Before switching it on we need to know which resources exist,
 * which roles hold them, and which features have no resource at all.
 *
 * Prints configuration only — role names, resource names/URLs, and the grant
 * matrix. No usernames, no emails, no client or staff data.
 *
 *   node scripts/dump-permissions.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [roles, resources, grants] = await Promise.all([
    prisma.role.findMany({
      select: { id: true, name: true, _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.resources.findMany({
      select: { id: true, name: true, frontEndURL: true, backEndURL: true },
      orderBy: { name: "asc" },
    }),
    prisma.roleToResource.findMany({
      select: { roleID: true, resourceID: true, read: true, granted: true },
    }),
  ]);

  console.log(`\n=== ROLES (${roles.length}) ===`);
  for (const r of roles) {
    console.log(`  ${r.id}  ${r.name}   (${r._count.users} user${r._count.users === 1 ? "" : "s"})`);
  }

  console.log(`\n=== RESOURCES (${resources.length}) ===`);
  console.log(`  ${"frontEndURL".padEnd(28)} ${"backEndURL".padEnd(26)} name`);
  for (const r of resources) {
    console.log(
      `  ${String(r.frontEndURL ?? "-").padEnd(28)} ${String(r.backEndURL ?? "-").padEnd(26)} ${r.name}`
    );
  }

  console.log(`\n=== GRANT MATRIX (${grants.length} rows) ===`);
  const roleName = Object.fromEntries(roles.map((r) => [r.id, r.name]));
  const resName = Object.fromEntries(
    resources.map((r) => [r.id, r.frontEndURL ?? r.name])
  );
  const byRole = new Map();
  for (const g of grants) {
    const k = roleName[g.roleID] ?? g.roleID;
    if (!byRole.has(k)) byRole.set(k, []);
    byRole.get(k).push(
      `${resName[g.resourceID] ?? g.resourceID}${g.granted ? " [write]" : g.read ? " [read]" : " [none]"}`
    );
  }
  for (const [role, list] of [...byRole].sort()) {
    console.log(`  ${role}`);
    for (const item of list.sort()) console.log(`      ${item}`);
  }

  const ungranted = resources.filter(
    (r) => !grants.some((g) => g.resourceID === r.id && (g.read || g.granted))
  );
  console.log(`\n=== RESOURCES NO ROLE CAN ACCESS (${ungranted.length}) ===`);
  for (const r of ungranted) console.log(`  ${r.frontEndURL ?? r.name}`);

  console.log("");
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
