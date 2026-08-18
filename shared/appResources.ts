/**
 * Every page in the app that a role can be granted or denied.
 *
 * This is the single source of truth for the permission grid. Before it, the
 * Resources table held nineteen rows covering the menu items and nothing else,
 * while the app has some thirty-five real pages — so the ទម្រង់ទី២-៦ screens,
 * the client and centre detail pages, and the dashboard itself had no row at
 * all. That is not the same as being denied: the route middleware only blocks a
 * page when a row exists saying so, and the API policy falls back to the same
 * assumption, so a page with no row was reachable by everyone.
 *
 * Lives in shared/ rather than server/utils/ because both sides need it: the
 * route middleware and the sidebar run in the browser, and Nuxt does not bundle
 * server/ into the client.
 *
 * `route` is the Nuxt route name, which is what `Resources.frontEndURL` holds
 * and what the middleware and `checkIfPageReadOnly()` compare against.
 *
 * Deliberately excluded: the vue3-tailwind component demos under
 * /components/**, /table/*, /form/general, /users, /welcome, and the two public
 * pages (/login, /contact) which must stay reachable signed-out.
 */

export interface AppResource {
  /** Nuxt route name === Resources.frontEndURL. */
  route: string;
  /** Stable key for the UI's label lookup; also the group heading. */
  group: "dashboard" | "client" | "service" | "centre" | "organisation" | "account" | "report";
  /** Khmer name stored in Resources.name, which is what existing rows use. */
  nameKh: string;
  /**
   * A page that only ever displays. Marking it means the grid can offer
   * "read-only" and "no access" but not "write", since there is nothing to
   * write — offering it would promise something the page cannot do.
   */
  readOnlyPage?: boolean;
}

/**
 * The list itself lives in appResources.json beside this file.
 *
 * It is data, and it has three consumers with different module systems: this
 * TypeScript module for the app, and the provisioning scripts under scripts/,
 * which are plain .mjs and cannot import a .ts file. A JSON file is the one
 * shape all of them can read, so the list cannot drift into two copies — which
 * is what had already happened to scripts/seed-permissions.mjs.
 */
import raw from "./appResources.json";

export const APP_RESOURCES: AppResource[] = raw as AppResource[];

/** Fast membership test for "is this route something we gate at all?". */
export const APP_RESOURCE_ROUTES = new Set(APP_RESOURCES.map((r) => r.route));

/**
 * Pages every signed-in user may open regardless of grants.
 *
 * Only the two public pages and a user's own profile. The dashboard is
 * deliberately *not* here: it is a ministry overview, and a centre clerk who
 * should not see national totals should be able to be denied it. Denying it
 * means the app has to land them somewhere else, which is what
 * `firstAllowedRoute` below is for.
 */
export const ALWAYS_ALLOWED_ROUTES = new Set(["login", "contact", "profile"]);

/**
 * Where to send someone whose landing page is denied — the first thing they may
 * open, in the order a ministry user would expect to land.
 *
 * The path is spelled out rather than derived from the route name: deriving it
 * happens to work for these but breaks the moment a route has a parameter.
 */
export const LANDING_ORDER: { route: string; path: string }[] = [
  { route: "index", path: "/" },
  { route: "client", path: "/client" },
  { route: "report", path: "/report" },
  { route: "service", path: "/service" },
  { route: "center-list", path: "/center/list" },
  { route: "organisation", path: "/organisation" },
  { route: "register-account", path: "/register/account" },
  { route: "role", path: "/role" },
];
