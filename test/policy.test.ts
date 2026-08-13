import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RULES,
  RESOURCE,
  matchRule,
  normalisePath,
  isEnforced,
  ENFORCED,
} from "../server/utils/policy";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = path.join(ROOT, "server", "api");

/** Every HTTP verb Nitro will infer from a filename suffix. */
const METHOD_SUFFIXES = ["get", "post", "put", "patch", "delete", "head", "options"];

interface Endpoint {
  /** Route path, e.g. "/api/center/staff/upsert" */
  route: string;
  /** Methods this file answers. A file with no suffix answers all of them. */
  methods: string[];
  file: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|js|mjs)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * Translate a Nitro handler filename into the route it serves, mirroring
 * Nitro's own conventions: `.post.ts` suffixes pick a verb, `index` collapses
 * to the directory, `[id]` becomes a path parameter, `[...]` a catch-all.
 */
function toEndpoint(file: string): Endpoint {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  let route = "/" + rel.replace(/^server\//, "").replace(/\.(ts|js|mjs)$/, "");

  let methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const suffix = route.match(/\.([a-z]+)$/)?.[1];
  if (suffix && METHOD_SUFFIXES.includes(suffix)) {
    methods = [suffix.toUpperCase()];
    route = route.slice(0, -(suffix.length + 1));
  }

  route = route.replace(/\/index$/, "");
  // `[...]` catch-all: `/api/auth/[...]` serves `/api/auth/anything`
  route = route.replace(/\/\[\.\.\.[^\]]*\]$/, "/CATCHALL");
  // `[id]` param: substitute a concrete value so patterns can be tested
  route = route.replace(/\[[^\]]+\]/g, "SAMPLE");

  return { route, methods, file: rel };
}

const ENDPOINTS: Endpoint[] = walk(API_DIR).map(toEndpoint);

describe("endpoint discovery", () => {
  it("finds the handlers on disk", () => {
    // Guards against the walker silently returning nothing, which would make
    // every coverage assertion below pass vacuously.
    expect(ENDPOINTS.length).toBeGreaterThan(40);
  });

  it("derives routes that start with /api/", () => {
    for (const e of ENDPOINTS) {
      expect(e.route, e.file).toMatch(/^\/api(\/|$)/);
    }
  });

  it("maps filenames to routes the way Nitro does", () => {
    const byFile = Object.fromEntries(ENDPOINTS.map((e) => [e.file, e]));
    expect(byFile["server/api/center/staff/upsert.post.ts"].route).toBe(
      "/api/center/staff/upsert"
    );
    expect(byFile["server/api/center/staff/upsert.post.ts"].methods).toEqual([
      "POST",
    ]);
    expect(byFile["server/api/contact/index.post.ts"].route).toBe("/api/contact");
    expect(byFile["server/api/service/[id].delete.ts"].route).toBe(
      "/api/service/SAMPLE"
    );
    expect(byFile["server/api/auth/[...].ts"].route).toBe("/api/auth/CATCHALL");
    // No method suffix — answers every verb.
    expect(byFile["server/api/me.ts"].methods.length).toBeGreaterThan(1);
  });
});

describe("policy coverage", () => {
  it("has a rule for every handler on disk", () => {
    const uncovered: string[] = [];
    for (const e of ENDPOINTS) {
      for (const m of e.methods) {
        if (!matchRule(m, e.route)) uncovered.push(`${m} ${e.route}  (${e.file})`);
      }
    }
    expect(uncovered, `\n${uncovered.join("\n")}\n`).toEqual([]);
  });

  it("has no rule that matches nothing on disk", () => {
    // A stale rule is a rule nobody is reading — usually a renamed endpoint
    // that quietly lost its protection.
    const unused = RULES.filter(
      (rule) =>
        !rule.virtual &&
        !ENDPOINTS.some((e) =>
          e.methods.some((m) => matchRule(m, e.route) === rule)
        )
    );
    expect(unused.map((r) => String(r.pattern))).toEqual([]);
  });

  it("uses the `virtual` escape hatch only for framework routes", () => {
    // `virtual` exempts a rule from the coverage check above, so it must stay
    // rare — otherwise the check can be silenced instead of satisfied.
    expect(RULES.filter((r) => r.virtual).map((r) => String(r.pattern))).toEqual(
      ["/^\\/api\\/_/"]
    );
  });

  it("names a resource on every permission rule", () => {
    const known = new Set<string>(Object.values(RESOURCE));
    for (const rule of RULES) {
      if (rule.mode !== "permission") continue;
      expect(known, String(rule.pattern)).toContain(rule.resource);
      expect(["read", "write"]).toContain(rule.action);
    }
  });
});

describe("fails closed", () => {
  it("refuses an endpoint nobody wrote a rule for", () => {
    expect(matchRule("POST", "/api/some/brand/new/endpoint")).toBeUndefined();
    expect(matchRule("GET", "/api/client/exportEverything")).toBeUndefined();
  });

  it("does not let a public rule leak onto a neighbouring path", () => {
    // /api/contact is public; its siblings must not inherit that.
    expect(matchRule("POST", "/api/contact")!.mode).toBe("public");
    expect(matchRule("POST", "/api/contact/get")!.mode).toBe("permission");
    expect(matchRule("POST", "/api/contact/delete")!.mode).toBe("permission");
  });

  it("only treats POST /api/contact as public", () => {
    expect(matchRule("GET", "/api/contact")).toBeUndefined();
  });

  it("keeps the hardcoded-admin endpoint denied", () => {
    const rule = matchRule("GET", "/api/me")!;
    expect(rule.mode).toBe("deny");
    expect(isEnforced("/api/me")).toBe(true);
  });
});

describe("read and write are separated", () => {
  const write = (m: string, p: string) => {
    const r = matchRule(m, p);
    expect(r, `${m} ${p}`).toBeDefined();
    expect(r!.mode, `${m} ${p}`).toBe("permission");
    return (r as any).action;
  };

  it("requires write on every mutating endpoint", () => {
    const mutations = [
      ["POST", "/api/client/personalInformation"],
      ["POST", "/api/client/personalInformationUpdate"],
      ["POST", "/api/center/upsert"],
      ["POST", "/api/center/delete"],
      ["POST", "/api/center/staff/upsert"],
      ["POST", "/api/center/staff/delete"],
      ["POST", "/api/center/staffOfficial/insert"],
      ["POST", "/api/center/staffOfficial/update"],
      ["POST", "/api/center/plan/upsert"],
      ["POST", "/api/center/plan/delete"],
      ["POST", "/api/organisation/upsert"],
      ["POST", "/api/organisation/delete"],
      ["POST", "/api/service/upsert"],
      ["DELETE", "/api/service/abc123"],
      ["POST", "/api/role/create"],
      ["POST", "/api/role/edit"],
      ["POST", "/api/role/delete"],
      ["POST", "/api/role/updateRoleToResource"],
      ["POST", "/api/user/upsert"],
      ["POST", "/api/user/delete"],
      ["POST", "/api/contact/update"],
      ["POST", "/api/contact/delete"],
      ["POST", "/api/deleteFile"],
    ];
    for (const [m, p] of mutations) expect(write(m, p), `${m} ${p}`).toBe("write");
  });

  it("asks only for read on retrieval endpoints", () => {
    const reads = [
      ["POST", "/api/client/personalInformationGet"],
      ["POST", "/api/center/get"],
      ["POST", "/api/center/getSingle"],
      ["POST", "/api/center/staff/get"],
      ["POST", "/api/center/staff/getSingleStaff"],
      ["POST", "/api/center/plan/get"],
      ["POST", "/api/center/plan/get-by-id"],
      ["GET", "/api/organisation/get"],
      ["POST", "/api/organisation/list"],
      ["GET", "/api/service"],
      ["GET", "/api/service/abc123"],
      ["GET", "/api/role/get"],
      ["POST", "/api/role/getRoleToResource"],
      ["POST", "/api/role/readResource"],
      ["GET", "/api/user/get"],
      ["POST", "/api/contact/get"],
    ];
    for (const [m, p] of reads) expect(write(m, p), `${m} ${p}`).toBe("read");
  });

  it("does not let a GET rule authorise the DELETE on the same path", () => {
    // /api/service/[id] is a read via GET and a write via DELETE. Order in
    // RULES must not let the read rule swallow the delete.
    expect((matchRule("GET", "/api/service/x") as any).action).toBe("read");
    expect((matchRule("DELETE", "/api/service/x") as any).action).toBe("write");
  });

  it("separates the client read grant from the client write grant", () => {
    const get = matchRule("POST", "/api/client/personalInformationGet") as any;
    const put = matchRule("POST", "/api/client/personalInformationUpdate") as any;
    expect(get.resource).toBe(put.resource);
    expect(get.action).toBe("read");
    expect(put.action).toBe("write");
  });
});

describe("session-only endpoints", () => {
  it("lets any signed-in user read their own token and permissions", () => {
    // These load on boot for every user; requiring a grant would lock out
    // exactly the users whose grants we are trying to read.
    for (const p of [
      "/api/token",
      "/api/user/permissions",
      "/api/role/readRoleandResource",
      "/api/user/checkUsername",
      "/api/user/upload",
    ]) {
      expect(matchRule("POST", p)!.mode, p).toBe("auth");
    }
  });

  it("still requires a session for them", () => {
    for (const p of ["/api/token", "/api/user/permissions"]) {
      expect(matchRule("GET", p)!.mode).not.toBe("public");
    }
  });
});

describe("normalisePath", () => {
  it("drops the query string", () => {
    expect(normalisePath("/api/center/get?id=abc")).toBe("/api/center/get");
  });

  it("drops the fragment", () => {
    expect(normalisePath("/api/center/get#x")).toBe("/api/center/get");
  });

  it("strips trailing slashes so /api/me/ cannot dodge the deny rule", () => {
    expect(normalisePath("/api/me/")).toBe("/api/me");
    expect(matchRule("GET", normalisePath("/api/me/"))!.mode).toBe("deny");
    expect(matchRule("GET", normalisePath("/api/me///"))!.mode).toBe("deny");
  });

  it("keeps the root path intact", () => {
    expect(normalisePath("/")).toBe("/");
  });

  it("leaves a normal path alone", () => {
    expect(normalisePath("/api/center/get")).toBe("/api/center/get");
  });
});

describe("gradual rollout", () => {
  it("enforces the client endpoints", () => {
    expect(isEnforced("/api/client/personalInformationGet")).toBe(true);
    expect(isEnforced("/api/client/personalInformationUpdate")).toBe(true);
  });

  it("leaves the rest in dry-run for now", () => {
    // Not a requirement, just a record of the current rollout stage — update
    // this list as endpoints are switched on.
    expect(isEnforced("/api/center/upsert")).toBe(false);
    expect(isEnforced("/api/role/create")).toBe(false);
  });

  it("matches only paths that exist", () => {
    for (const p of ENFORCED) {
      const hit = ENDPOINTS.some((e) => p.test(e.route));
      expect(hit, `ENFORCED pattern matches no endpoint: ${p}`).toBe(true);
    }
  });

  it("does not enforce by accident on unrelated paths", () => {
    expect(isEnforced("/api/contact")).toBe(false);
    expect(isEnforced("/api/clientele/x")).toBe(false);
  });
});
