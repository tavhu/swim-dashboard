import type { Action } from "./permissions";

/**
 * Access policy for every `/api/**` route.
 *
 * Rules are evaluated in order by `server/middleware/authorize.ts`. Anything
 * under `/api/` with no matching rule is refused — the policy fails closed, so
 * a new endpoint is unreachable until it is listed here. That's deliberate:
 * forgetting a rule produces a 403 in development rather than an open endpoint
 * in production.
 *
 * `resource` refers to a row in the `Resources` table, matched on its
 * `frontEndURL` — the same key the UI's permission store uses, so one row
 * governs both the page and the endpoints behind it.
 */

interface Base {
  method?: string | string[];
  pattern: RegExp;
  /**
   * Route is registered by a Nuxt module at runtime rather than by a file in
   * `server/api`. The coverage test skips these, since there is nothing on
   * disk for it to match them against.
   */
  virtual?: boolean;
  note?: string;
}

export type Rule =
  /** No session required. */
  | ({ mode: "public" } & Base)
  /** Valid session required, but no specific permission. */
  | ({ mode: "auth" } & Base)
  /** Session plus a `read`/`write` grant on `resource`. */
  | ({ mode: "permission"; resource: string; action: Action } & Base)
  /** Always rejected. */
  | ({ mode: "deny" } & Base);

/**
 * Resource keys. The first group already exists in `Resources`; the second is
 * created by `scripts/seed-permissions.mjs` for features added since.
 */
export const RESOURCE = {
  // existing
  client: "client",
  clientRegister: "client-register",
  center: "center",
  centerList: "center-list",
  centerStaff: "center-staff",
  contactList: "contact-list",
  role: "role",
  userCreate: "register",
  userList: "register-account",
  file: "file",
  /** Not a page — the right to approve or reject ទម្រង់ទី១-៦ for one's own centre. */
  approval: "approval",
  feedbackList: "feedback-list",
  about: "about",
  referral: "referral",
  referralType: "referral-type",
  // added for features built since
  organisation: "organisation",
  service: "service",
  centerPlan: "center-plan",
  clientType: "client-type",
  clientTypeRegister: "client-type-register",
} as const;

export const RULES: Rule[] = [
  // --- framework internals --------------------------------------------------
  { mode: "public", pattern: /^\/api\/auth(\/|$)/ },
  // Nitro/module-owned routes (`/api/_nuxt_icon`, devtools, etc.) — no file in
  // server/api, and blocking them breaks the framework.
  { mode: "public", pattern: /^\/api\/_/, virtual: true },

  // --- public site ----------------------------------------------------------
  // The contact form is reachable by anonymous visitors and is gated by
  // reCAPTCHA inside the handler rather than by a session.
  { mode: "public", method: "POST", pattern: /^\/api\/contact\/?$/ },

  // --- disabled -------------------------------------------------------------
  {
    mode: "deny",
    pattern: /^\/api\/me\/?$/,
    note: "Created a hardcoded admin account. Delete the handler when convenient.",
  },

  // --- session-only ---------------------------------------------------------
  // Returns the caller's own JWT / own permissions. Requiring a grant here
  // would lock out every user, since the UI loads these on boot.
  { mode: "auth", pattern: /^\/api\/token\/?$/ },
  { mode: "auth", pattern: /^\/api\/user\/permissions\/?$/ },
  { mode: "auth", pattern: /^\/api\/role\/readRoleandResource\/?$/ },
  { mode: "auth", pattern: /^\/api\/user\/checkUsername\/?$/ },
  { mode: "auth", pattern: /^\/api\/user\/upload\/?$/ },

  // --- clients --------------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/client\/personalInformationGet\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/personalInformation(Update)?\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  {
    // /api/client/ is in ENFORCED, so this endpoint would fail closed for
    // everyone without a rule here.
    mode: "permission",
    pattern: /^\/api\/client\/delete\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // ទម្រង់ទី១'s own approval. Must sit before the sub-form rules only in the
  // sense that its pattern is anchored — /api/client/approve cannot be confused
  // with /api/client/<form>/approve.
  {
    mode: "permission",
    pattern: /^\/api\/client\/approve\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/service\/(get|options)\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/service\/upsert\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // Deleting one ទម្រង់ទី២-៦ record is gated as a write on `client`, the same as
  // editing one: both change a client's case file, and a user who can rewrite a
  // record's every field can already destroy its contents. Removing the *client*
  // is a separate rule above.
  {
    mode: "permission",
    pattern: /^\/api\/client\/service\/(approve|delete)\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // ទម្រង់ទី៣ ផែនការករណី — a client's case file, so gated on `client` like the
  // forms either side of it, and already covered by ENFORCED's /api/client/.
  {
    mode: "permission",
    pattern: /^\/api\/client\/case-plan\/get\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/case-plan\/(upsert|approve|delete)\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // ទម្រង់ទី៤ សមាហរណកម្ម — same reasoning as ទម្រង់ទី៣.
  {
    mode: "permission",
    pattern: /^\/api\/client\/reintegration\/get\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/reintegration\/(upsert|approve|delete)\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // ទម្រង់ទី៥ តាមដាន និងវាយតម្លៃ — same reasoning as the forms either side.
  {
    mode: "permission",
    pattern: /^\/api\/client\/follow-up\/get\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/follow-up\/(upsert|approve|delete)\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },
  // ទម្រង់ទី៦ បិទករណី — the last of the six, same reasoning as the rest.
  {
    mode: "permission",
    pattern: /^\/api\/client\/case-closure\/get\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/case-closure\/(upsert|approve|delete)\/?$/,
    resource: RESOURCE.client,
    action: "write",
  },

  // --- roles & permissions --------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/role\/(get|getRoleToResource|readResource)\/?$/,
    resource: RESOURCE.role,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/role\/(create|edit|delete|updateRoleToResource)\/?$/,
    resource: RESOURCE.role,
    action: "write",
  },

  // --- user accounts --------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/user\/get\/?$/,
    resource: RESOURCE.userList,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/user\/upsert\/?$/,
    resource: RESOURCE.userCreate,
    action: "write",
  },
  {
    mode: "permission",
    pattern: /^\/api\/user\/delete\/?$/,
    resource: RESOURCE.userList,
    action: "write",
  },

  // --- referrals ------------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/client\/referral\/get\/?$/,
    resource: RESOURCE.referral,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/client\/referral\/(upsert|approve|delete)\/?$/,
    resource: RESOURCE.referral,
    action: "write",
  },
  {
    // The dropdown's source — a lookup of referral service names, read by both
    // ទម្រង់ទី៣'s ខ. section and the referral form. Any signed-in user may read
    // it: gating it on `referral` broke Form 3 for data-entry staff, who fill
    // that form but hold no referral right. Maintaining the list is the separate
    // `referral-type` write rule below.
    mode: "auth",
    pattern: /^\/api\/referral-type\/?$/,
  },
  {
    mode: "permission",
    pattern: /^\/api\/referral-type\/(upsert|delete)\/?$/,
    resource: RESOURCE.referralType,
    action: "write",
  },

  // --- feedback and the About page ------------------------------------------
  {
    // Anyone signed in may leave មតិយោបល់ — a system nobody can complain about
    // is a system whose problems stay invisible.
    mode: "auth",
    pattern: /^\/api\/feedback\/create\/?$/,
  },
  {
    mode: "permission",
    pattern: /^\/api\/feedback\/list\/?$/,
    resource: RESOURCE.feedbackList,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/feedback\/handled\/?$/,
    resource: RESOURCE.feedbackList,
    action: "write",
  },
  {
    // Reading អំពីយើង needs only a session; writing it is a grant.
    mode: "auth",
    pattern: /^\/api\/about\/get\/?$/,
  },
  {
    mode: "permission",
    pattern: /^\/api\/about\/upsert\/?$/,
    resource: RESOURCE.about,
    action: "write",
  },

  // --- approval queue -------------------------------------------------------
  {
    // Read on `approval` — the same row that grants the right to decide. A
    // read-only grant is a meaningful state here: see the queue, without the
    // អនុម័ត and បដិសេធ buttons, which the panel checks for write.
    mode: "permission",
    pattern: /^\/api\/approval\/pending\/?$/,
    resource: RESOURCE.approval,
    action: "read",
  },

  // --- service centres ------------------------------------------------------
  {
    // "which centre am I attached to" — answered from the session, so there is
    // nothing here a caller could ask for that is not already theirs. Browsing
    // the centre list is a separate question and keeps its own permission below.
    mode: "auth",
    pattern: /^\/api\/center\/mine\/?$/,
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/(get|getSingle)\/?$/,
    resource: RESOURCE.centerList,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/upsert\/?$/,
    resource: RESOURCE.center,
    action: "write",
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/delete\/?$/,
    resource: RESOURCE.centerList,
    action: "write",
  },

  // --- centre plans (ផែនការមជ្ឈមណ្ឌល) ---------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/center\/plan\/(get|get-by-id)\/?$/,
    resource: RESOURCE.centerPlan,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/plan\/(upsert|delete)\/?$/,
    resource: RESOURCE.centerPlan,
    action: "write",
  },

  // --- centre staff ---------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/center\/staff\/(get|getSingleStaff)\/?$/,
    resource: RESOURCE.centerStaff,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/staff\/(upsert|delete)\/?$/,
    resource: RESOURCE.centerStaff,
    action: "write",
  },
  {
    mode: "permission",
    pattern: /^\/api\/center\/staffOfficial\/(insert|update)\/?$/,
    resource: RESOURCE.centerStaff,
    action: "write",
  },

  // --- organisations --------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/organisation\/(get|list)\/?$/,
    resource: RESOURCE.organisation,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/organisation\/(upsert|delete)\/?$/,
    resource: RESOURCE.organisation,
    action: "write",
  },

  // --- services -------------------------------------------------------------
  { mode: "permission", pattern: /^\/api\/service\/?$/, resource: RESOURCE.service, action: "read" },
  {
    mode: "permission",
    method: "GET",
    pattern: /^\/api\/service\/[^/]+\/?$/,
    resource: RESOURCE.service,
    action: "read",
  },
  {
    mode: "permission",
    method: "DELETE",
    pattern: /^\/api\/service\/[^/]+\/?$/,
    resource: RESOURCE.service,
    action: "write",
  },
  {
    mode: "permission",
    pattern: /^\/api\/service\/upsert\/?$/,
    resource: RESOURCE.service,
    action: "write",
  },

  // --- client types (ប្រភេទអតិថិជន) -----------------------------------------
  // Ordered before the `[id]` patterns so /api/client-type/upsert is matched as
  // the upsert route rather than as an id.
  {
    mode: "permission",
    pattern: /^\/api\/client-type\/upsert\/?$/,
    resource: RESOURCE.clientTypeRegister,
    action: "write",
  },
  { mode: "permission", pattern: /^\/api\/client-type\/?$/, resource: RESOURCE.clientType, action: "read" },
  {
    mode: "permission",
    method: "GET",
    pattern: /^\/api\/client-type\/[^/]+\/?$/,
    resource: RESOURCE.clientType,
    action: "read",
  },
  {
    mode: "permission",
    method: "DELETE",
    pattern: /^\/api\/client-type\/[^/]+\/?$/,
    resource: RESOURCE.clientType,
    action: "write",
  },

  // --- reports --------------------------------------------------------------
  // Every report aggregates client records, and the client register report
  // lists them by name, so this is the same resource with the same read grant.
  {
    mode: "permission",
    pattern: /^\/api\/report\/(data|export)\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },

  // --- dashboard ------------------------------------------------------------
  // Counts of client records, so gated on the same resource the records are.
  // Nothing here returns a row — only totals — but "how many clients does this
  // centre have" is still client information.
  {
    mode: "permission",
    pattern: /^\/api\/dashboard\/summary\/?$/,
    resource: RESOURCE.client,
    action: "read",
  },

  // --- contact messages -----------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/contact\/get\/?$/,
    resource: RESOURCE.contactList,
    action: "read",
  },
  {
    mode: "permission",
    pattern: /^\/api\/contact\/(update|delete)\/?$/,
    resource: RESOURCE.contactList,
    action: "write",
  },

  // --- files ----------------------------------------------------------------
  {
    mode: "permission",
    pattern: /^\/api\/deleteFile\/?$/,
    resource: RESOURCE.file,
    action: "write",
  },
];

/**
 * Which paths are actually enforced.
 *
 * The permission data was reconstructed rather than inherited, so switching
 * every endpoint on at once risks locking users out of features that work
 * today. Anything matching a pattern here is enforced; everything else is
 * evaluated and **logged only** — you can see exactly who would have been
 * refused before making it real.
 *
 * Roll out by adding patterns, verifying the logs stay quiet, then moving on.
 * `[/.*­/]` enforces everything.
 */
export const ENFORCED: RegExp[] = [
  // Everything. The rollout is over.
  //
  // This list used to hold only /api/client/, /api/client-type and /api/me,
  // which meant the permission check ran for every other endpoint, computed the
  // right answer, and then only wrote it to the log:
  //
  //   [authorize] WOULD REFUSE  POST /api/role/updateRoleToResource  user=…
  //
  // So roles, accounts, centres, organisations, services and reports were
  // guarded in the browser and nowhere else. Every route under /api now has a
  // rule — checked against the route files — so enforcing all of them refuses
  // nothing that should be allowed.
  //
  // A new endpoint added without a rule will fail closed, and the middleware
  // says so by name. That is the right default for an access-control system:
  // the cost of forgetting is a 403 in development, not an open door in
  // production.
  /^\/api\//,
];

export function isEnforced(path: string): boolean {
  return ENFORCED.some((p) => p.test(path));
}

/** Strip query string and normalise trailing slashes. */
export function normalisePath(url: string): string {
  const path = url.split("?")[0].split("#")[0];
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function matchRule(method: string, path: string): Rule | undefined {
  const m = method.toUpperCase();
  return RULES.find((rule) => {
    if (!rule.pattern.test(path)) return false;
    if (!rule.method) return true;
    const allowed = Array.isArray(rule.method) ? rule.method : [rule.method];
    return allowed.map((x) => x.toUpperCase()).includes(m);
  });
}
