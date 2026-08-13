#!/usr/bin/env node
/**
 * Back up the database before a risky migration.
 *
 * `pg_dump` ships with PostgreSQL but is rarely on PATH on Windows, so this
 * finds it, reads the connection details out of DATABASE_URL, and writes a
 * timestamped custom-format dump into ./backups.
 *
 *   node scripts/backup-db.mjs
 *   node scripts/backup-db.mjs --user=postgres     # if the app user lacks rights
 *
 * Restore with:
 *   pg_restore -U postgres -d swim_dashboard --clean --if-exists <file>
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const userOverride = args
  .find((a) => a.startsWith("--user="))
  ?.slice("--user=".length);

// --- connection details ----------------------------------------------------
function readEnv() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envFile)) return null;
  const line = fs
    .readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .find((l) => /^\s*DATABASE_URL\s*=/.test(l));
  if (!line) return null;
  return line
    .slice(line.indexOf("=") + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const url = readEnv();
if (!url) {
  console.error("No DATABASE_URL in the environment or .env");
  process.exit(1);
}

let conn;
try {
  const u = new URL(url);
  conn = {
    host: u.hostname || "localhost",
    port: u.port || "5432",
    user: userOverride || decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  };
} catch {
  console.error("DATABASE_URL is not a valid URL");
  process.exit(1);
}

// --- locate pg_dump --------------------------------------------------------
function findPgDump() {
  const exe = process.platform === "win32" ? "pg_dump.exe" : "pg_dump";

  // Already on PATH?
  try {
    execFileSync(exe, ["--version"], { stdio: "ignore" });
    return exe;
  } catch {
    /* keep looking */
  }

  const roots =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\PostgreSQL",
          "C:\\Program Files (x86)\\PostgreSQL",
        ]
      : ["/usr/lib/postgresql", "/usr/local/opt/postgresql/bin", "/opt/homebrew/opt"];

  const found = [];
  for (const root of roots) {
    if (!fs.existsSync(root)) continue;
    for (const entry of fs.readdirSync(root)) {
      const candidate = path.join(root, entry, "bin", exe);
      if (fs.existsSync(candidate)) found.push({ version: entry, candidate });
    }
  }
  if (found.length === 0) return null;

  // Prefer the newest: a dump written by an older pg_dump than the server can
  // be rejected on restore.
  found.sort((a, b) => parseFloat(b.version) - parseFloat(a.version));
  return found[0].candidate;
}

const pgDump = findPgDump();
if (!pgDump) {
  console.error(
    "\nCouldn't find pg_dump. It lives in the PostgreSQL install, e.g.\n" +
      "  C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe\n\n" +
      "Either add that bin folder to PATH, or run it directly with:\n" +
      `  & "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe" -U ${conn.user} -h ${conn.host} -p ${conn.port} -d ${conn.database} -F c -f backup.dump\n`
  );
  process.exit(1);
}

// --- run -------------------------------------------------------------------
const outDir = path.resolve(process.cwd(), "backups");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outFile = path.join(outDir, `${conn.database}_${stamp}.dump`);

console.log(`\n  pg_dump:  ${pgDump}`);
console.log(`  database: ${conn.database} on ${conn.host}:${conn.port} as ${conn.user}`);
console.log(`  writing:  ${outFile}\n`);

try {
  execFileSync(
    pgDump,
    [
      "-h", conn.host,
      "-p", conn.port,
      "-U", conn.user,
      "-d", conn.database,
      "-F", "c",
      "-f", outFile,
    ],
    {
      stdio: "inherit",
      // Passing the password this way keeps it out of the process list.
      env: { ...process.env, PGPASSWORD: conn.password },
    }
  );
} catch (e) {
  console.error(
    "\npg_dump failed. If it's a permissions error, retry with the superuser:\n" +
      "  node scripts/backup-db.mjs --user=postgres\n"
  );
  process.exitCode = 1;
  process.exit();
}

const size = fs.statSync(outFile).size;
if (size < 1024) {
  console.error(`\n  !! dump is only ${size} bytes — check it before relying on it\n`);
  process.exitCode = 1;
} else {
  console.log(`\n  Done — ${(size / 1024 / 1024).toFixed(2)} MB\n`);
  console.log(`  Restore:  pg_restore -U postgres -d ${conn.database} --clean --if-exists "${outFile}"\n`);
}
