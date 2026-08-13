#!/usr/bin/env node
/**
 * Creates the first user on a fresh database.
 *
 * Setup used to come from the committed pg_dump.sql, which carried real
 * accounts — including the bcrypt hashes for admin and superadmin. That file is
 * no longer tracked, so a new checkout has a schema and reference data but
 * nobody to sign in as. This fills that gap without putting a credential in the
 * repository.
 *
 * There is deliberately no default password. `/api/me` once created an `admin`
 * account with a hardcoded one on every call, which was an account-takeover
 * waiting for that account to be renamed — see SECURITY.md. The password is
 * read from stdin so it stays out of shell history and out of `ps`.
 *
 * Usage:
 *   node scripts/create-admin.mjs --username admin --role "Super Admin"
 *   node scripts/create-admin.mjs --username admin --role Admin --firstname Thona --lastname Thy
 *
 * Refuses to overwrite an existing username. To change a password, use the
 * app's own profile page rather than this script.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import readline from "node:readline";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const username = flag("username");
const roleName = flag("role", "Super Admin");
const firstname = flag("firstname", username);
const lastname = flag("lastname", username);

if (!username) {
  console.error("Usage: node scripts/create-admin.mjs --username <name> [--role <role>]");
  process.exit(1);
}

function askPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question("Password: ", (a) => { rl.close(); resolve(a); }));
}

try {
  const existing = await prisma.user.findFirst({
    where: { username },
    select: { id: true },
  });
  if (existing) {
    console.error(`A user named "${username}" already exists (${existing.id}). Refusing to overwrite.`);
    process.exit(1);
  }

  const role = await prisma.role.findFirst({
    where: { name: roleName },
    select: { id: true, name: true },
  });
  if (!role) {
    const all = await prisma.role.findMany({ select: { name: true } });
    console.error(
      `No role named "${roleName}".` +
        (all.length
          ? ` Available: ${all.map((r) => r.name).join(", ")}`
          : " No roles exist — load prisma/seed-reference-data.sql first.")
    );
    process.exit(1);
  }

  const password = (await askPassword()).trim();
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const user = await prisma.user.create({
    data: {
      username,
      firstname,
      lastname,
      password: await bcrypt.hash(password, 12),
      status: true,
      userRoleID: role.id,
    },
    select: { id: true, username: true },
  });

  console.log(`\nCreated ${user.username} (${user.id}) with role ${role.name}.`);
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
