# Schema reconciliation

Notes on why migrations 38 and 39 exist, and what the `scripts/` tooling is
for. Written after reconciling a database that had been through a different
migration history.

## What was wrong

Three things should agree: `prisma/schema.prisma` (the plan),
`prisma/migrations/` (the history), and the database itself. All three had
drifted apart.

**`schema.prisma` was ahead of the migrations.** `Organisation`,
`User.accountType`, `User.organisationID` and the `organisationID` columns on
`ServiceCenter` / `Staff` / `governStaff` were in the schema but in no
migration — the schema had been edited without generating one. Any database
built purely from `prisma migrate deploy` lacked them, while
`/api/user/upsert` and `/api/user/checkUsername` referenced them. Migration
`20260813090000` closes that gap.

**The approval workflow existed only in the database.** Built on a side
branch, so `ApprovalEvent` and its two enums were real tables with no migration
behind them. Prisma treats an unrecognised table as drift and offers to reset
the database, so this was one `prisma migrate dev` away from data loss. Also
folded into `20260813090000`.

**Two parallel address schemas.** A side branch added six-part address columns
(`House` / `Street` / `Village` / `Commune` / `District` / `Province`) without
noticing that main already stored addresses as `<prefix>Address` free text plus
`City` / `District` / `Commune` / `Village` — and then dropped several of
main's columns. The forms write to main's names, so client and staff saves were
broken. Repaired with `scripts/repair-addresses.mjs`, which copies the data
across before dropping the duplicates.

## Migration 38 is written defensively

`20260813090000_organisation_and_approval` uses `IF NOT EXISTS` everywhere, and
`DO $$ ... EXCEPTION WHEN duplicate_object` for enums and constraints, which
have no such clause. It has to converge from two different starting points: a
fresh clone (no approval, no `Organisation`) and a database off the side branch
(approval present, `Organisation` absent). Both were tested against a real
PostgreSQL 16, run twice each, and produce identical results.

## Scripts

| Script | Use |
| --- | --- |
| `backup-db.mjs` | Finds `pg_dump` (it's rarely on PATH on Windows), reads `DATABASE_URL`, writes a timestamped dump to `backups/`. Run before anything below. |
| `migration-preflight.mjs` | Checks pending migrations against the real database shape and reports which would fail, before you run them. |
| `restore-missing-columns.mjs` | Recreates columns a pending migration needs to `ALTER` or `DROP` but that no longer exist. |
| `resolve-column-collision.mjs` | The reverse: rescues data from, then drops, a column a pending migration wants to add. |
| `apply-migration-manually.mjs` | Applies a migration whose SQL can't run as written — chiefly `ADD COLUMN … NOT NULL` with no default against a table that has rows. |
| `repair-addresses.mjs` | The duplicate-address repair described above. Not a migration: a fresh database never had the duplicates. |
| `dump-ddl.mjs` | Prints real column types, constraints and enum values. Structure only, no row data. |
| `dump-permissions.mjs` | Roles, resources and the grant matrix. |
| `seed-permissions.mjs` | Creates missing `Resources` rows; `--corrections` also reduces one grant. See `SECURITY.md`. |
| `user-roles.mjs` | Lists users and their roles; repairs a lost role. Uses only columns common to every schema version, so it works when the client is stale. |

## What the preflight checks

It reports a **failure**, not a warning, for each of these — a checking tool
that stays quiet about what it doesn't understand is worse than no tool, since
it produces confidence rather than caution:

- `ALTER COLUMN` on a column that doesn't exist
- `DROP COLUMN` on a missing column, unless the statement says `IF EXISTS`
- `ADD COLUMN` on an existing column, unless it says `IF NOT EXISTS`
- `CREATE TABLE` on an existing table, same caveat
- `ADD COLUMN … NOT NULL` with no `DEFAULT` against a table that has rows

Each of those cost a failed `migrate deploy` before being added.

## If you hit this again

```bash
node scripts/backup-db.mjs
node scripts/migration-preflight.mjs     # read it; don't skip to deploy
```

Then fix whatever it reports, re-run the preflight until it says
`0 would fail`, and only then `npx prisma migrate deploy`.

If a migration fails halfway, Prisma records it and blocks everything after.
Clear it with `npx prisma migrate resolve --rolled-back <name>` — each
migration runs in a transaction, so a failure leaves no partial changes, only
the blocking record.

Finally, `migrate status` saying "up to date" is **not** the same as the
database matching the schema. It only compares migration names. The real check
is:

```bash
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script
```

`-- This is an empty migration.` means genuinely in sync.
