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

```bash
git clone git@github.com:tavhu/swim-dashboard.git
cd swim-dashboard
npm install
```

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

Create a database and a shadow database (Prisma uses the second as scratch
space for `migrate dev`), build the schema from the migrations, then load the
reference data:

```bash
createdb swim_dashboard_dev
createdb swim_dashboard_shadow
npx prisma migrate deploy
npx prisma generate
psql -d swim_dashboard_dev -f prisma/seed-reference-data.sql
```

The migrations alone produce the full schema — verified against
`schema.prisma` with `prisma migrate diff`. The seed adds roles, resources,
the role/resource grant matrix and the service catalogue. It contains no
personal data.

That leaves no account to sign in with, so create one:

```bash
node scripts/create-admin.mjs --username admin --role "Super Admin"
```

It asks for the password on stdin, so it stays out of shell history. Minimum
12 characters, and it will not overwrite an existing username.

On Windows, `psql` and `createdb` are usually not on `PATH`. Either add
`C:\Program Files\PostgreSQL\16\bin` to it, or call them by full path.

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

## Security

[SECURITY.md](SECURITY.md) documents fixed vulnerabilities and the reasoning
behind the permission model. Worth reading before touching `server/api/` or
anything under `server/middleware/`.
