import { describe, it, expect } from "vitest";
import {
  hasPermission,
  isInCenterScope,
  canAssignRole,
  type Grant,
} from "../server/utils/permissions";

const g = (
  resource: string,
  read: boolean,
  granted: boolean
): Grant => ({ resource, read, granted });

describe("hasPermission", () => {
  it("denies when the role holds no grant for the resource", () => {
    expect(hasPermission([], "client", "read")).toBe(false);
    expect(hasPermission([], "client", "write")).toBe(false);
    expect(hasPermission([g("center", true, true)], "client", "read")).toBe(false);
  });

  it("denies when the grant exists but both flags are off", () => {
    // A row in RoleToResource is not itself permission — the UI creates rows
    // for every resource when a role is edited.
    const grants = [g("client", false, false)];
    expect(hasPermission(grants, "client", "read")).toBe(false);
    expect(hasPermission(grants, "client", "write")).toBe(false);
  });

  it("allows read on a read grant", () => {
    expect(hasPermission([g("client", true, false)], "client", "read")).toBe(true);
  });

  it("refuses write on a read-only grant", () => {
    // This is the case the /api/user/permissions handler got wrong: it derived
    // write from `read`, so read-only roles were shown edit and delete.
    expect(hasPermission([g("client", true, false)], "client", "write")).toBe(
      false
    );
  });

  it("allows write on a write grant", () => {
    expect(hasPermission([g("client", false, true)], "client", "write")).toBe(
      true
    );
  });

  it("treats write as implying read", () => {
    // Roles are sometimes saved with granted=true and read=false. Someone who
    // may edit a record must be able to load it first.
    expect(hasPermission([g("client", false, true)], "client", "read")).toBe(
      true
    );
  });

  it("matches the resource key exactly", () => {
    const grants = [g("center", true, true)];
    expect(hasPermission(grants, "center-list", "read")).toBe(false);
    expect(hasPermission(grants, "center-staff", "read")).toBe(false);
    expect(hasPermission(grants, "cent", "read")).toBe(false);
    expect(hasPermission(grants, "Center", "read")).toBe(false);
    expect(hasPermission(grants, "center", "read")).toBe(true);
  });

  it("picks the right grant out of many", () => {
    const grants = [
      g("center", true, true),
      g("client", true, false),
      g("role", false, false),
    ];
    expect(hasPermission(grants, "center", "write")).toBe(true);
    expect(hasPermission(grants, "client", "write")).toBe(false);
    expect(hasPermission(grants, "client", "read")).toBe(true);
    expect(hasPermission(grants, "role", "read")).toBe(false);
  });

  it("does not mutate the grants it is given", () => {
    const grants = [g("client", true, false)];
    const before = JSON.stringify(grants);
    hasPermission(grants, "client", "write");
    expect(JSON.stringify(grants)).toBe(before);
  });
});

describe("canAssignRole", () => {
  // The real ids from this database. Both have a Resources row whose
  // frontEndURL is the role id, which is how the app marks a role as gated.
  const ADMIN = "clnt7w5430004vnd8s5db1fop";
  const SUPER = "clnt5dq1d0003vnf442tydhi7";
  const STAFF = "cloau9h5s0001vnh4r9xdhi3e"; // បុគ្គលិកមណ្ឌល — no resource row
  const GATED = [ADMIN, SUPER];

  it("lets Super Admin assign either gated role", () => {
    const grants = [g(ADMIN, true, true), g(SUPER, true, true)];
    expect(canAssignRole(grants, ADMIN, GATED)).toBe(true);
    expect(canAssignRole(grants, SUPER, GATED)).toBe(true);
  });

  it("stops Admin assigning Super Admin", () => {
    // Admin's real grants: Admin [write], Super Admin [none]. This is the
    // privilege escalation the endpoint allowed.
    const grants = [g(ADMIN, true, true), g(SUPER, false, false)];
    expect(canAssignRole(grants, ADMIN, GATED)).toBe(true);
    expect(canAssignRole(grants, SUPER, GATED)).toBe(false);
  });

  it("stops a role with no grant at all assigning a gated role", () => {
    expect(canAssignRole([], SUPER, GATED)).toBe(false);
    expect(canAssignRole([], ADMIN, GATED)).toBe(false);
  });

  it("does not accept read as permission to assign", () => {
    // "May see this role in a list" is not "may hand it out".
    expect(canAssignRole([g(SUPER, true, false)], SUPER, GATED)).toBe(false);
  });

  it("allows ungated roles for anyone who got this far", () => {
    // Reaching the check already required write on `register`.
    expect(canAssignRole([], STAFF, GATED)).toBe(true);
  });

  it("gates on the exact role id", () => {
    expect(canAssignRole([g(ADMIN, true, true)], ADMIN + "x", GATED)).toBe(true);
    expect(canAssignRole([g(ADMIN, true, true)], SUPER, GATED)).toBe(false);
  });

  it("treats an empty gated list as nothing being gated", () => {
    // If the resource rows were ever deleted, this degrades to the old
    // behaviour rather than locking everyone out of user management.
    expect(canAssignRole([], SUPER, [])).toBe(true);
  });
});

describe("isInCenterScope", () => {
  it("lets a ministry-level user reach any centre", () => {
    expect(isInCenterScope(null, "centre-a")).toBe(true);
    expect(isInCenterScope(null, "centre-b")).toBe(true);
  });

  it("lets a ministry-level user reach unscoped records", () => {
    expect(isInCenterScope(null, null)).toBe(true);
    expect(isInCenterScope(null, undefined)).toBe(true);
  });

  it("lets a centre user reach their own centre", () => {
    expect(isInCenterScope("centre-a", "centre-a")).toBe(true);
  });

  it("stops a centre user reaching another centre", () => {
    // The point of the whole guard: one rehab centre must not read another
    // centre's clients.
    expect(isInCenterScope("centre-a", "centre-b")).toBe(false);
  });

  it("stops a centre user reaching a record with no centre", () => {
    // A missing serviceCenterID must not read as "belongs to everyone".
    expect(isInCenterScope("centre-a", null)).toBe(false);
    expect(isInCenterScope("centre-a", undefined)).toBe(false);
    expect(isInCenterScope("centre-a", "")).toBe(false);
  });

  it("compares ids exactly", () => {
    expect(isInCenterScope("centre-a", "centre-a ")).toBe(false);
    expect(isInCenterScope("centre-a", "Centre-A")).toBe(false);
    expect(isInCenterScope("centre-a", "centre-a1")).toBe(false);
  });
});
