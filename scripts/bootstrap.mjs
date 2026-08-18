#!/usr/bin/env node
/**
 * Provisions a fresh database: roles, the permission grid, and the first
 * Super Admin.
 *
 * Standing this up by hand means creating three roles, thirty-eight resource
 * rows, two role-assignment gates and a hundred and twenty grants in the right
 * combination — which is a long afternoon and one typo away from a system
 * nobody can administer. This does the whole thing in one command, and is safe
 * to run again.
 *
 *   node scripts/bootstrap.mjs                 # dry run: says what it would do
 *   node scripts/bootstrap.mjs --apply         # roles, resources, grants
 *   node scripts/bootstrap.mjs --apply --admin # …and prompt for the first account
 *
 * Idempotent, and deliberately conservative:
 *
 *   - an existing grant is never changed, so re-running after you have tuned
 *     Admin's permissions does not undo that work;
 *   - the exception is Super Admin, which is always set to write on everything.
 *     It is the only role that can repair the permission screen, so it must not
 *     be possible to leave it locked out of one;
 *   - it will not touch an existing user, and there is no default password.
 *
 * ## Adding a page later
 *
 * A new page is not gated until it appears in shared/appResources.json. The
 * route guard and the API policy both deny by default now, so a page missing
 * from that file is a page nobody can open — and one that never shows up in the
 * permission grid. Add the route there, then run this again with --apply to
 * create the row and backfill every role.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_RESOURCES = JSON.parse(
  fs.readFileSync(path.join(HERE, "..", "shared", "appResources.json"), "utf8")
);

const SUPER_ADMIN = "Super Admin";

/**
 * The roles a new installation starts with.
 *
 * Only Super Admin is given anything. The others are created denied across the
 * board so that granting them is a decision someone makes on the permission
 * screen, rather than something this script guessed.
 */
const ROLES = [
  { name: SUPER_ADMIN, description: "សិទ្ធិពេញលេញលើប្រព័ន្ធទាំងមូល" },
  { name: "Admin", description: "គ្រប់គ្រងទិន្នន័យ និងគណនី" },
  { name: "data entry", description: "បញ្ចូលទិន្នន័យ" },
];

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const WITH_ADMIN = args.includes("--admin");

const prisma = new PrismaClient();
const plan = [];
const note = (line) => plan.push(line);

async function ensureRoles() {
  const out = new Map();
  for (const r of ROLES) {
    let role = await prisma.role.findUnique({ where: { name: r.name }, select: { id: true, name: true } });
    if (!role) {
      note(`role        + ${r.name}`);
      if (APPLY) {
        role = await prisma.role.create({
          data: { name: r.name, description: r.description },
          select: { id: true, name: true },
        });
      }
    }
    if (role) out.set(r.name, role);
  }
  return out;
}

async function ensureResources() {
  for (const r of APP_RESOURCES) {
    const existing = await prisma.resources.findFirst({
      where: { frontEndURL: r.route },
      select: { id: true },
    });
    if (existing) continue;
    // `name` is unique; a clash with an unrelated row would abort the run.
    const clash = await prisma.resources.findUnique({ where: { name: r.nameKh }, select: { id: true } });
    const name = clash ? `${r.nameKh} (${r.route})` : r.nameKh;
    note(`resource    + ${r.route}  (${name})`);
    if (APPLY) await prisma.resources.create({ data: { name, frontEndURL: r.route } });
  }
}

/**
 * A Resources row whose frontEndURL is a *role id* means "may hand out this
 * role". It is the app's existing convention and it is what stops an Admin
 * creating a Super Admin, so a fresh database needs one per role.
 */
async function ensureRoleGates(roles) {
  for (const role of roles.values()) {
    const existing = await prisma.resources.findFirst({
      where: { frontEndURL: role.id },
      select: { id: true },
    });
    if (existing) continue;
    const name = `មានសិទ្ធិផ្តល់តួនាទី ${role.name}`;
    note(`role gate   + ${role.name}`);
    if (APPLY) await prisma.resources.create({ data: { name, frontEndURL: role.id } });
  }
}

async function ensureGrants(roles) {
  const resources = await prisma.resources.findMany({ select: { id: true, frontEndURL: true } });
  const existing = await prisma.roleToResource.findMany({ select: { roleID: true, resourceID: true } });
  const have = new Set(existing.map((l) => `${l.roleID}:${l.resourceID}`));

  let created = 0;
  const toCreate = [];
  for (const role of roles.values()) {
    const isSuper = role.name === SUPER_ADMIN;
    for (const res of resources) {
      if (have.has(`${role.id}:${res.id}`)) continue;
      toCreate.push({ roleID: role.id, resourceID: res.id, granted: isSuper, read: isSuper });
      created++;
    }
  }
  if (created) note(`grants      + ${created} missing (Super Admin write, others denied)`);
  if (APPLY && toCreate.length) {
    await prisma.roleToResource.createMany({ data: toCreate, skipDuplicates: true });
  }

  // Super Admin is repaired rather than merely backfilled: it is the only role
  // that can fix the permission screen, so it must always be able to open it.
  const su = roles.get(SUPER_ADMIN);
  if (su) {
    const wrong = await prisma.roleToResource.count({
      where: { roleID: su.id, OR: [{ granted: false }, { read: false }] },
    });
    if (wrong) {
      note(`grants      ~ ${wrong} Super Admin row(s) reset to full access`);
      if (APPLY) {
        await prisma.roleToResource.updateMany({
          where: { roleID: su.id },
          data: { granted: true, read: true },
        });
      }
    }
  }
}

/**
 * Prompted, never defaulted and never passed as an argument.
 *
 * The same reasoning as scripts/create-admin.mjs: a password on the command
 * line lands in shell history and in `ps`, and a default password is an
 * account-takeover waiting for someone to forget to change it.
 */
function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    })
  );
}

async function ensureSuperAdminUser(roles) {
  const su = roles.get(SUPER_ADMIN);
  if (!su) return;

  const existing = await prisma.user.findFirst({
    where: { userRoleID: su.id },
    select: { username: true },
  });
  if (existing) {
    note(`account     = ${existing.username} already holds ${SUPER_ADMIN}; leaving it alone`);
    return;
  }
  if (!APPLY) {
    note(`account     + would prompt for a ${SUPER_ADMIN} username and password`);
    return;
  }

  // Without a terminal there is nobody to prompt, and the answers come back
  // empty — which would otherwise look like the user simply declined. Say what
  // is wrong instead of exiting quietly having done nothing.
  if (!process.stdin.isTTY) {
    console.error(
      "\n--admin needs an interactive terminal to ask for the username and password." +
        "\nRun it directly rather than through a pipe or a CI step, or create the" +
        "\naccount afterwards with: node scripts/create-admin.mjs --role \"Super Admin\""
    );
    process.exitCode = 1;
    return;
  }

  const username = (await ask("Super Admin username: ")).trim();

  if (!/^[A-Za-z0-9._-]+$/.test(username)) {
    console.error("Username must be Latin letters, digits and . _ - with no spaces.");
    process.exitCode = 1;
    return;
  }

  const password = await ask("Password (min 8 characters): ");
  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters. No account created.");
    process.exitCode = 1;
    return;
  }

  await prisma.user.create({
    data: {
      username,
      password: await bcrypt.hash(password, 12),
      userRoleID: su.id,
      status: true,
      accountType: "USER",
    },
  });
  note(`account     + ${username} (${SUPER_ADMIN})`);
}

async function main() {
  console.log(APPLY ? "Applying…\n" : "Dry run — nothing will be written. Add --apply to commit.\n");

  const roles = await ensureRoles();
  await ensureResources();

  // Gates need role ids, so on a dry run against an empty database there is
  // nothing to hang them on yet. Say so rather than printing a confusing zero.
  if (roles.size) {
    await ensureRoleGates(roles);
    await ensureGrants(roles);
    if (WITH_ADMIN) await ensureSuperAdminUser(roles);
  } else {
    note("role gate   ? roles do not exist yet; re-run with --apply to create them first");
  }

  if (!plan.length) {
    console.log("Nothing to do — this database is already provisioned.");
  } else {
    plan.forEach((l) => console.log("  " + l));
  }

  const [roleCount, resCount, grantCount, userCount] = await Promise.all([
    prisma.role.count(),
    prisma.resources.count(),
    prisma.roleToResource.count(),
    prisma.user.count(),
  ]);
  console.log(
    `\nnow: ${roleCount} roles, ${resCount} resources, ${grantCount} grants, ${userCount} users`
  );
  if (!APPLY) console.log("\n(dry run — re-run with --apply to make these changes)");
}

main()
  .catch((e) => {
    console.error("\nbootstrap failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
