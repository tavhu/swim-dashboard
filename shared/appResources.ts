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

export const APP_RESOURCES: AppResource[] = [
  { route: "index", group: "dashboard", nameKh: "ផ្ទាំងគ្រប់គ្រង", readOnlyPage: true },

  // --- អតិថិជន, and the six national forms hanging off a client ------------
  { route: "client", group: "client", nameKh: "បញ្ជី អតិថិជន" },
  { route: "client-register", group: "client", nameKh: "ចុះឈ្មោះ អតិថិជន" },
  { route: "client-register-id", group: "client", nameKh: "កែសម្រួល អតិថិជន" },
  { route: "client-id-id", group: "client", nameKh: "ទម្រង់ទី១ ព័ត៌មានអតិថិជន" },

  { route: "client-service-clientId", group: "client", nameKh: "ទម្រង់ទី២ បញ្ជីការប្រើសេវាកម្ម" },
  { route: "client-service-form", group: "client", nameKh: "ទម្រង់ទី២ បញ្ចូល/កែសម្រួល" },
  { route: "client-service-view-id", group: "client", nameKh: "ទម្រង់ទី២ មើលលម្អិត", readOnlyPage: true },

  { route: "client-case-plan-clientId", group: "client", nameKh: "ទម្រង់ទី៣ បញ្ជីផែនការករណី" },
  { route: "client-case-plan-form", group: "client", nameKh: "ទម្រង់ទី៣ បញ្ចូល/កែសម្រួល" },
  { route: "client-case-plan-view-id", group: "client", nameKh: "ទម្រង់ទី៣ មើលលម្អិត", readOnlyPage: true },

  { route: "client-reintegration-clientId", group: "client", nameKh: "ទម្រង់ទី៤ បញ្ជីសមាហរណកម្ម" },
  { route: "client-reintegration-form", group: "client", nameKh: "ទម្រង់ទី៤ បញ្ចូល/កែសម្រួល" },
  { route: "client-reintegration-view-id", group: "client", nameKh: "ទម្រង់ទី៤ មើលលម្អិត", readOnlyPage: true },

  { route: "client-follow-up-clientId", group: "client", nameKh: "ទម្រង់ទី៥ បញ្ជីការតាមដាន" },
  { route: "client-follow-up-form", group: "client", nameKh: "ទម្រង់ទី៥ បញ្ចូល/កែសម្រួល" },
  { route: "client-follow-up-view-id", group: "client", nameKh: "ទម្រង់ទី៥ មើលលម្អិត", readOnlyPage: true },

  { route: "client-case-closure-clientId", group: "client", nameKh: "ទម្រង់ទី៦ បញ្ជីការបិទករណី" },
  { route: "client-case-closure-form", group: "client", nameKh: "ទម្រង់ទី៦ បញ្ចូល/កែសម្រួល" },
  { route: "client-case-closure-view-id", group: "client", nameKh: "ទម្រង់ទី៦ មើលលម្អិត", readOnlyPage: true },

  // --- សេវា និងប្រភេទអតិថិជន ------------------------------------------------
  { route: "service", group: "service", nameKh: "បញ្ចី សេវា" },
  { route: "service-register", group: "service", nameKh: "បង្កើត សេវា" },
  { route: "service-edit-id", group: "service", nameKh: "កែសម្រួល សេវា" },
  { route: "client-type", group: "service", nameKh: "បញ្ចី ប្រភេទអតិថិជន" },
  { route: "client-type-register", group: "service", nameKh: "បង្កើត ប្រភេទអតិថិជន" },
  { route: "client-type-edit-id", group: "service", nameKh: "កែសម្រួល ប្រភេទអតិថិជន" },

  // --- មណ្ឌល ----------------------------------------------------------------
  { route: "center-list", group: "centre", nameKh: "បញ្ជី មណ្ឌល" },
  { route: "center", group: "centre", nameKh: "ចុះឈ្មោះមណ្ឌល" },
  { route: "center-id-id", group: "centre", nameKh: "ព័ត៌មានលម្អិត មណ្ឌល", readOnlyPage: true },
  { route: "center-staff", group: "centre", nameKh: "បុគ្គលិកមណ្ឌល" },
  { route: "center-plan", group: "centre", nameKh: "ផែនការមជ្ឈមណ្ឌល" },
  { route: "center-centerdocumentation", group: "centre", nameKh: "ឯកសារកាលប្បវត្តិ មណ្ឌល" },

  // --- ស្ថាប័ន ---------------------------------------------------------------
  { route: "organisation", group: "organisation", nameKh: "អង្គភាព" },

  // --- គណនី និងសិទ្ធិ --------------------------------------------------------
  { route: "register-account", group: "account", nameKh: "បញ្ជី គណនី" },
  { route: "register", group: "account", nameKh: "ចុះឈ្មោះ គណនី" },
  { route: "role", group: "account", nameKh: "តួនាទី និងការអនុញ្ញាត" },
  { route: "contact-list", group: "account", nameKh: "បញ្ជី ប្រអប់សារ" },

  // --- របាយការណ៍ -------------------------------------------------------------
  { route: "report", group: "report", nameKh: "របាយការណ៏", readOnlyPage: true },
];

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
