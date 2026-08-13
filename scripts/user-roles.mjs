#!/usr/bin/env node
/**
 * Inspect and repair the role attached to a user account.
 *
 * Exists because losing the last Super Admin locks you out of the screen you
 * would normally use to fix it. Run it directly against the database.
 *
 * Prints usernames, role names and status — no passwords, no client data.
 *
 *   node scripts/user-roles.mjs
 *   node scripts/user-roles.mjs --user=thona --role="Super Admin"
 *   node scripts/user-roles.mjs --user=thona --role="Super Admin" --apply
 *   node scripts/user-roles.mjs --user=thona --enable --apply
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const ENABLE = args.includes("--enable");
const arg = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3).replace(/^["']|["']$/g, "") : null;
};
const USER = arg("user");
const ROLE = arg("role");

try {
  const [users, roles] = await Promise.all([
    // Only fields common to every version of this schema. A recovery tool has
    // to run against the database you actually have, which may be behind the
    // checked-out branch — that is often *why* you are running it.
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        status: true,
        userRoleID: true,
        Role: { select: { name: true } },
      },
      orderBy: { username: "asc" },
    }),
    prisma.role.findMany({ select: { id: true, name: true } }),
  ]);

  console.log(`\n=== USERS (${users.length}) ===`);
  console.log(`  ${"username".padEnd(20)} ${"role".padEnd(22)} status`);
  for (const u of users) {
    const role = u.Role?.name ?? (u.userRoleID ? `?? ${u.userRoleID}` : "— none —");
    console.log(
      `  ${u.username.padEnd(20)} ${role.padEnd(22)} ${u.status ? "active" : "DISABLED"}`
    );
  }

  // Losing every account that can administer the system is the failure this
  // script exists to catch, so say so loudly rather than leaving it to be read
  // out of the table above.
  for (const name of ["Super Admin", "Admin"]) {
    const holders = users.filter((u) => u.Role?.name === name && u.status);
    if (holders.length === 0) {
      console.log(`\n  !! no active user holds "${name}"`);
    }
  }

  if (!USER) {
    console.log(
      '\nTo repair:  node scripts/user-roles.mjs --user=<username> --role="Super Admin" --apply\n'
    );
    process.exit(0);
  }

  const user = users.find((u) => u.username === USER);
  if (!user) {
    console.error(`\nNo user named ${JSON.stringify(USER)}.\n`);
    process.exitCode = 1;
    process.exit();
  }

  const data = {};
  if (ROLE) {
    const role = roles.find((r) => r.name === ROLE);
    if (!role) {
      console.error(
        `\nNo role named ${JSON.stringify(ROLE)}. Roles: ${roles
          .map((r) => r.name)
          .join(", ")}\n`
      );
      process.exitCode = 1;
      process.exit();
    }
    data.userRoleID = role.id;
    console.log(
      `\n  ${user.username}: role ${user.Role?.name ?? "none"} -> ${role.name}`
    );
  }
  if (ENABLE) {
    data.status = true;
    console.log(`  ${user.username}: status ${user.status} -> true`);
  }

  if (Object.keys(data).length === 0) {
    console.log("\nNothing to change. Pass --role=... and/or --enable.\n");
    process.exit(0);
  }

  if (!APPLY) {
    console.log("\nDry run — rerun with --apply to write it.\n");
    process.exit(0);
  }

  await prisma.user.update({ where: { id: user.id }, data });
  console.log("\nApplied. Sign out and back in to pick up the new grants.\n");
} catch (e) {
  console.error("Failed:", e?.message ?? e);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
