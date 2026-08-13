# Security fixes

Ported onto the current `main`. Each entry is a real vulnerability found in the
live code, with the fix and how it's tested.

## Fixed

### `/api/me` — account takeover

Created a user named `admin` with the hardcoded password `admin123` on **every
call, for any caller with a session**:

```ts
await prisma.user.create({
  data: { username: "admin", password: await hash("admin123", 12), … }
});
```

`username` is unique, so it fails while a real `admin` exists — but if that
account were ever deleted or renamed, any signed-in user could POST here and
take over the system. It was one-off bootstrap code. The handler now returns
410; the file can be deleted outright.

### `/api/deleteFile` — arbitrary file deletion

```ts
let newPath = body?.imgURL;
fs.unlink("public/" + newPath, () => { … });
```

No validation. `{ "imgURL": "../nuxt.config.ts" }` deleted that file. Anything
the Node process could reach was reachable — source, migrations, `.env`.

Now goes through `resolveUploadPath` (`server/utils/uploads.ts`), which
normalises the input and then verifies the **resolved** path is still inside
`public/uploads`. Rejects absolute paths, Windows drive paths, null bytes, and
every traversal form.

### `/api/user/upload` — stored XSS

The extension came from the client-supplied filename or MIME type and the file
was written straight into the public web root, so a caller could land a `.html`
file at a public URL and have it served from your own origin.

Now: a fixed MIME→extension allowlist (images, PDF, Word, Excel), a 10 MB cap,
a server-generated UUID filename, and cleanup of partial writes on failure.
Nothing from the client reaches the filesystem. The response shape is unchanged
(`{ 0: "uploads/…" }`), so callers reading `image[0]` still work.

### `/api/user/checkUsername` — password hash disclosure

`findFirst` with no `select`, returning the **entire User row including the
bcrypt hash** to any signed-in caller — a user-enumeration and
hash-harvesting endpoint in one. Now selects only the fields
`pages/register/index.vue` actually reads. `password` is never returned.

### `/api/role/readRoleandResource` — permissions IDOR

Took the user id from the request body:

```ts
const userID = body?.userID
prisma.user.findUnique({ where: { id: userID }, … })
```

so any signed-in user could read anyone else's permissions by passing a
different id. Now taken from the session; the body is ignored.

## Also included

**`composables/apiFetch.ts`** — during SSR, Nuxt calls internal API routes
through a *fresh* `$fetch` that doesn't carry the browser's cookies, so
session-checking endpoints see nothing on a hard refresh. `useApiFetch`
attaches `useRequestHeaders(['cookie'])`, which is the incoming request's
cookies on the server and `{}` in the browser.

Use it for `/api/**` calls; plain `useFetch` is fine for third-party URLs.
Existing pages have **not** been converted yet — that's a mechanical follow-up.

### `/api/user/permissions` — write access derived from read

```ts
const canWrite = p.read;                       // ← the write flag is `granted`
return { …, write: canWrite, update: canWrite, del: canWrite };
```

Every role with **read** on a resource was told it could write, update and
delete it, so the UI showed edit and delete controls to read-only accounts —
and because the endpoints did not check permissions at all, those controls
worked. Now derived from `p.granted`. The handler also uses `requireAuth`
instead of a second `getServerSession` call, which returns null during SSR.

Expect read-only roles to lose buttons they previously had. That is the fix
working; if a role genuinely needs to edit, grant it write in `/role`.

### `/api/user/upsert` — privilege escalation and account takeover

The handler checked that *a* session existed, then passed the request body
straight into `prisma.user.upsert`. Both the role and the target id came from
the client:

```ts
if (!session) return { status: 'unauthenticated' }
await prisma.user.upsert({
  where:  { id: body?.id },
  update: { userRoleID: body?.userRoleID, … },
})
```

So any signed-in account — including `បុគ្គលិកមណ្ឌល`, a centre data-entry
user — could:

- **become Super Admin**, by POSTing its own id with the Super Admin role id.
  The role dropdown in `pages/register/index.vue` was the only limit, and it is
  built in the browser.
- **take over any other account**, by POSTing someone else's id with
  `updatePass: true` and a chosen password.

The app already had the right idea, just only on the read path. `/api/role/get`
filters the dropdown using a quiet convention: a `Resources` row whose
`frontEndURL` is a **role id** means "may assign this role". Your data has two —
Admin and Super Admin — which is why Admin holds `clnt7w54…[write]` (may create
Admins) and `clnt5dq1…[none]` (may not create Super Admins).

The write path now enforces the same rule (`canAssignRole` in
`permissions.ts`, `assertCanAssignRole` in `authorize.ts`). Editing anyone
other than yourself requires write on `register`; editing yourself ignores the
submitted role and status entirely, so a profile edit cannot be a promotion.
Roles with no resource row stay ungated, matching the dropdown.

### `/api/role/get` — assignable-roles IDOR

Took `?userID=` from the query string and returned that user's assignable
roles, so anyone could read anyone else's. Now taken from the session; the
parameter only decides *whether* to filter.

## Server-side authorization

Permissions used to be enforced only in the browser (`stores/permission.ts`,
`plugins/0.permission.ts`, the route middleware). The endpoints checked for *a*
session and nothing more, so any signed-in account could call any endpoint
directly with `fetch` and read or write anything — including named minors'
case records.

Four pieces:

| File | Role |
| --- | --- |
| `server/utils/permissions.ts` | Pure logic: `hasPermission`, `isInCenterScope`. No framework imports, so it unit-tests without booting Nuxt. |
| `server/utils/policy.ts` | One rule per endpoint — all 47. Each names a `Resources.frontEndURL` and `read`/`write`. |
| `server/utils/authorize.ts` | `getAuthUser` (session → user + grants, cached on the event), `requireAuth`, `requirePermission`, `assertCenterScope`, `centerScopeFilter`. |
| `server/middleware/authorize.ts` | Applies the policy to every `/api/**` request before the handler runs. |

It fails closed: an endpoint with no rule, or a rule naming a resource with no
row in `Resources`, denies everyone.

### Rolling it out

The permission grid was reconstructed rather than inherited, so enforcing all
47 endpoints at once could lock users out of features that work today. Instead,
the middleware evaluates every request but only *refuses* paths listed in
`ENFORCED` (`server/utils/policy.ts`). Everything else logs what would have
happened:

```
[authorize] WOULD REFUSE  POST /api/center/upsert  — user=sok role=Officer needs center/write
```

Currently enforced: `/api/client/**` (the most sensitive data in the system)
and `/api/me`.

To widen it:

1. Run the app normally and watch the server log.
2. For each `WOULD REFUSE` line, decide whether the user *should* have that
   access — if so grant the resource in `/role`; if not, the log is confirming
   the guard would do its job.
3. Add the path to `ENFORCED` once its lines stop appearing.
4. When the log is quiet, replace the list with `[/.*/]`.

### Missing resource rows

`organisation`, `service` and `center-plan` have endpoints but no `Resources`
row, so they deny everyone the moment they are enforced.

```bash
node scripts/dump-permissions.mjs                          # what exists today
node scripts/seed-permissions.mjs --mirror --corrections   # dry run, full preview
node scripts/seed-permissions.mjs --apply --mirror --corrections
```

`--mirror` seeds each new resource's grants from an existing one:
`organisation` and `service` from `center`, `center-plan` from `center-staff`
(not `center` — `center` is the *create a centre* permission and
ប្រធានមជ្ឈមណ្ឌល doesn't hold it, yet a centre's own plan is exactly their
business). `--grant-to="<role>"` grants read+write to a named role instead.
Re-running is a no-op.

### `--corrections`

Everything else in that script only ever creates. `--corrections` is the one
part that *reduces* an existing grant, which is why it's opt-in. Currently one
entry: **មន្រីឃុំសង្កាត់ loses write on `center`**, dropping to read.

Sangkat officials do intake; they were able to create and edit service centres,
and mirroring would have carried that into organisation and service too. After
this they keep read on all three. Expect the create/edit centre buttons to
disappear for that role — that's the change working.

Each correction only fires while the current state still matches its `from`
clause, so it won't fight a later deliberate edit. But if you decide the role
*should* have centre write, delete the entry from `CORRECTIONS` rather than
just re-granting it — otherwise the next `--corrections` run undoes you.

### Centre scoping

`assertCenterScope` / `centerScopeFilter` restrict a user with a
`serviceCenterID` to their own centre's records; `null` means ministry level
and sees everything. The helpers exist and are tested, but are **not yet wired
into the handlers** — one rehab centre can still read another's clients. That
is the next piece of work.

## Testing

```bash
npm test
```

81 tests:

- **`uploads.test.ts`** (33) — path-traversal rules, plus assertions that the
  old vulnerable patterns are gone from each handler.
- **`policy.test.ts`** (26) — walks `server/api` on disk and asserts every
  handler resolves to a rule, that no rule is stale, that every mutating
  endpoint requires `write`, and that `/api/me/` can't dodge the deny rule via
  a trailing slash. Add an endpoint without a rule and this suite fails.
- **`permissions.test.ts`** (22) — the grant logic, the read-implies-write bug,
  and the role-assignment rule using your real Admin / Super Admin role ids.

### Note on the role-assignment fix

It reads the gating rows live, so if the two role-id `Resources` rows are ever
deleted the check degrades to the old behaviour (nothing gated) rather than
locking everyone out of user management. That is the safer failure for an
account-management screen, but it does mean those two rows are load-bearing —
don't tidy them away.
