# SWIMS — ប្រព័ន្ធគ្រប់គ្រងព័ត៌មានសុខុមាលភាពសង្គម

Social Welfare Information Management System for the Ministry of Social
Affairs, Veterans and Youth Rehabilitation. Nuxt 3 + Prisma + PostgreSQL,
with Firebase for messaging.

Built from the [nuxt3-admin-template](https://github.com/WailanTirajoh/nuxt3-admin-template)
starter, which is where the `components/`, `layouts/` and `store/` conventions
come from.

## Requirements

| | Version | Notes |
| --- | --- | --- |
| Node | `^20.19.0 \|\| >=22.12.0` | Enforced by Nuxt 3.21 / Vite 7. Older versions fail with unrelated-looking errors. |
| PostgreSQL | 16 | The committed dump was produced by pg_dump 16; restoring it with an older client can fail. |
| npm | 10+ | Ships with the Node versions above. |

Check with `node -v` before anything else. If it is wrong, the rest of the
setup will fail in ways that do not point at the version.

- **Windows:** install Node with [nvm-windows](https://github.com/coreybutler/nvm-windows) —
  `nvm install 22.12.0 && nvm use 22.12.0`
- **macOS:** `nvm use` picks up `.nvmrc`

## Setup

The whole sequence, for someone starting from nothing:

```bash
git clone git@github.com:tavhu/swim-dashboard.git
cd swim-dashboard
npm install                                   # 1. dependencies
cp .env.example .env                          # 2. fill in the real values
createdb swim_dashboard_dev                   # 3. databases
createdb swim_dashboard_shadow
npm run setup:fresh                           # 4. schema, roles, permissions,
                                              #    and the first Super Admin
npm run dev                                   # 5. http://localhost:3000
```

Step 4 is the one that does the work: it applies the migrations, creates the
roles and the permission grid, and then prompts for the first account. Each
step is explained below.

### Dependencies

`npm install` compiles nothing on 64-bit Windows or macOS — `bcrypt` ships
prebuilt binaries for both. Windows on ARM has no prebuild and would need
Visual Studio Build Tools.

### Environment

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

Fill in the real values. `.env` is gitignored and must stay that way: it holds
the database credentials, the Firebase service-account key and the SMTP
password. Never commit it, and never point `DATABASE_URL` at production while
developing — Prisma commands can rewrite schema.

`NUXT_FIREBASE_PRIVATE_KEY` must be one quoted line with literal `\n` escapes,
exactly as it appears in the service-account JSON.

### Database

Create a database and a shadow database — Prisma uses the second as scratch
space for `migrate dev`:

```bash
createdb swim_dashboard_dev
createdb swim_dashboard_shadow
```

The schema is built by the next step. To do it separately:

```bash
npx prisma migrate deploy
npx prisma generate
```

The migrations alone produce the full schema — verified against
`schema.prisma` with `prisma migrate diff`.

On Windows, `psql` and `createdb` are usually not on `PATH`. Either add
`C:\Program Files\PostgreSQL\16\bin` to it, or call them by full path.

### Provision roles, permissions and the first account

The permission model **denies by default**, on the server as well as in the
browser. A fresh database therefore has no roles, no permission grid and no
account — and nothing to sign in with. One command sets all of it up:

```bash
npm run setup:fresh
```

That is `prisma migrate deploy` followed by the bootstrap, so it covers the
schema too, and it ends by asking for the first Super Admin's username and
password. Against a database that already has its schema, or to see what it
would do before it does it:

```bash
npm run bootstrap         # dry run — prints the plan, writes nothing
npm run bootstrap:apply   # roles, resources, permission grid
```

What it creates:

| | |
| --- | --- |
| Roles | `Super Admin`, `Admin`, `data entry` |
| Resources | one row per page (see `shared/appResources.json`), plus a role-assignment gate per role |
| Permissions | every role × resource pair — Super Admin write throughout, the others denied |
| First account | prompted for, with the Super Admin role |

It is **idempotent** and safe to re-run. An existing grant is never changed, so
running it again after you have tuned Admin's permissions does not undo that
work. The one exception is Super Admin, which is always reset to full access:
it is the only role that can repair the permission screen, so it must not be
possible to leave it locked out of one. Existing users are never touched.

There is no default password. It is prompted for, never passed as an argument —
a password on the command line lands in shell history and in `ps`. `--admin`
needs a real terminal; in a pipe or a CI step it refuses rather than quietly
creating nothing. To add the account separately:

```bash
node scripts/create-admin.mjs --username admin --role "Super Admin"
```

#### Optional: the sample service catalogue

`prisma/seed-reference-data.sql` carries a small service catalogue. It also
contains the *original* roles and permission rows, so load it **before** the
bootstrap — the bootstrap will then fill in everything it is missing:

```bash
psql -d swim_dashboard_dev -f prisma/seed-reference-data.sql
npm run bootstrap:apply
```

Skip it entirely if you do not want the sample services. It contains no
personal data.

### Run

```bash
npm run dev          # http://localhost:3000
```

## Working across two machines

The repo normalises line endings to LF via `.gitattributes`, so the same
checkout is byte-identical on macOS and Windows. Do not override
`core.autocrlf` locally.

`package-lock.json` is gitignored, so each machine resolves its own dependency
tree and the two can drift. After pulling changes that touch `package.json`,
run `npm install` rather than assuming the existing `node_modules` is correct.

## Database and migration work

Read [MIGRATION-NOTES.md](MIGRATION-NOTES.md) before changing the schema. In
short: back up, run the preflight, then `migrate deploy` — never
`prisma migrate dev` against a database you care about, as it offers a
destructive reset when it sees drift.

```bash
node scripts/backup-db.mjs
node scripts/migration-preflight.mjs
npx prisma migrate deploy
```

`scripts/backup-db.mjs` locates `pg_dump` itself, including in the standard
Windows install locations.

## Roles and permissions

Access is decided per **page**, per **role**, in three states — អនុញ្ញាត
(write), បានត្រឹមមើល (read-only) and មិនអនុញ្ញាត (no access) — edited on
`/role`. The menu hides what a role cannot open, including a whole group when
every page under it is denied.

Both sides deny by default:

- `middleware/permission.global.ts` guards the routes in the browser.
- `server/middleware/authorize.ts` guards every request under `/api/`, using
  the rules in `server/utils/policy.ts`. This is the one that matters — the
  browser guard is a convenience, and can be bypassed by anyone willing to open
  the console.

### Adding a page

A new page is **unreachable until it is registered**. Two steps:

1. Add its Nuxt route name to `shared/appResources.json`:

   ```json
   { "route": "client-transfer", "group": "client", "nameKh": "ការបញ្ជូនអតិថិជន" }
   ```

   Add `"readOnlyPage": true` if the page only displays — the grid then offers
   read-only and no-access, but not write, since there is nothing there to
   write.

2. Run `npm run bootstrap:apply` to create the row and backfill a grant for
   every role.

The route name is what Nuxt derives from the file path: `pages/client/index.vue`
→ `client`, `pages/client/service/[clientId].vue` → `client-service-clientId`.

### Adding an API endpoint

Add a rule to `server/utils/policy.ts`. Without one the endpoint fails closed
and the log says so by name:

```
[authorize] Forbidden: no access policy defined for this endpoint  POST /api/…
```

That is deliberate. The cost of forgetting is a 403 in development rather than
an open door in production.

### Rules that are not editable in the grid

Enforced in `server/utils/roleGuard.ts`:

- only **Super Admin** may write roles or permissions;
- no role may rename or delete **itself**;
- the Super Admin role and its name are reserved, so "cannot create a Super
  Admin" cannot be sidestepped by creating a second role called one;
- Super Admin's own grid is fixed at full access — it is the only role that can
  repair the permission screen.

## Security

[SECURITY.md](SECURITY.md) documents fixed vulnerabilities and the reasoning
behind the permission model. Worth reading before touching `server/api/` or
anything under `server/middleware/`.
