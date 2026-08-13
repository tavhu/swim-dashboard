#!/usr/bin/env node
/**
 * Sets a new password for an existing user.
 *
 * bcrypt hashes are one-way: a forgotten password cannot be recovered from the
 * database, only replaced. This is also how to retire the `admin` and
 * `superadmin` hashes that were committed in the old pg_dump.sql — they remain
 * in git history and are open to offline cracking until the passwords change.
 *
 * The password is read from stdin, not argv, so it stays out of shell history
 * and out of `ps`. There is no default.
 *
 * Usage:
 *   node scripts/reset-password.mjs --username superadmin
 *   node scripts/reset-password.mjs --list
 *
 * Check which database you are pointed at before running: DATABASE_URL decides,
 * and the same command will happily rewrite a production account.
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

// Read lines through one interface's async iterator rather than `question()`.
// With piped input readline reaches EOF and closes as soon as it is created, so
// a `question()` registered after the first read never resolves — the second
// prompt then died on an unsettled await instead of reporting the mismatch.
// The iterator yields on each line and ends cleanly at EOF either way.
let rl;
let lines;
const ask = async (prompt) => {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    lines = rl[Symbol.asyncIterator]();
  }
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) {
    console.error("\nNo input. Nothing changed.");
    process.exit(1);
  }
  return value;
};

try {
  // Show which database this is about to touch — the whole point of the
  // confirmation below is that it is easy to be pointed somewhere unintended.
  const target = (process.env.DATABASE_URL || "").replace(/\/\/[^@]*@/, "//***@");
  console.log(`database: ${target || "(DATABASE_URL unset)"}\n`);

  if (args.includes("--list")) {
    const users = await prisma.user.findMany({
      select: { username: true, firstname: true, lastname: true, status: true },
      orderBy: { username: "asc" },
    });
    for (const u of users) {
      console.log(`  ${u.username}  (${u.firstname} ${u.lastname})${u.status ? "" : "  [disabled]"}`);
    }
    process.exit(0);
  }

  const username = flag("username");
  if (!username) {
    console.error("Usage: node scripts/reset-password.mjs --username <name>   (or --list)");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { username },
    select: { id: true, username: true },
  });
  if (!user) {
    console.error(`No user named "${username}". Run with --list to see the accounts.`);
    process.exit(1);
  }

  const password = (await ask(`New password for ${user.username}: `)).trim();
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const again = (await ask("Confirm: ")).trim();
  if (password !== again) {
    console.error("Passwords do not match. Nothing changed.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(password, 12) },
  });

  console.log(`\nPassword updated for ${user.username}.`);
} catch (e) {
  console.error("Failed:", e.message);
  process.exit(1);
} finally {
  rl?.close();
  await prisma.$disconnect();
}
