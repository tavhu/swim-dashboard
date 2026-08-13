/**
 * Pure permission logic, free of Nuxt/h3 imports so it can be unit-tested
 * without booting the framework. `authorize.ts` wraps these with session
 * lookup and HTTP errors.
 *
 * Same model the UI already uses (`stores/permission.ts`): a resource is
 * identified by its `Resources.frontEndURL`, and each (role, resource) pair
 * carries `read` and `granted` (write).
 */

export type Action = "read" | "write";

export interface Grant {
  /** Matches `Resources.frontEndURL`. */
  resource: string;
  read: boolean;
  /** Write permission. Named after the `RoleToResource.granted` column. */
  granted: boolean;
}

/** A write grant implies read; a missing grant denies. */
export function hasPermission(
  grants: readonly Grant[],
  resource: string,
  action: Action
): boolean {
  const grant = grants.find((g) => g.resource === resource);
  if (!grant) return false;
  return action === "write" ? grant.granted : grant.read || grant.granted;
}

/**
 * Whether a user may hand out `roleId`.
 *
 * The app gates role assignment with a quiet convention: a `Resources` row
 * whose `frontEndURL` is a **role id** means "may assign this role". Today two
 * exist — one for Admin, one for Super Admin — which is how Admin can create
 * Admins but not Super Admins. `/api/role/get` already uses this to filter the
 * dropdown; without the same check on the write path, the dropdown is the only
 * thing standing between any account and Super Admin.
 *
 * Roles with no such row are ungated: anyone who may create users may assign
 * them. That matches the existing dropdown behaviour.
 */
export function canAssignRole(
  grants: readonly Grant[],
  roleId: string,
  gatedRoleIds: readonly string[]
): boolean {
  if (!gatedRoleIds.includes(roleId)) return true;
  return hasPermission(grants, roleId, "write");
}

/**
 * Whether a user may act on records belonging to `targetCenterId`.
 * A null `userCenterId` means unscoped — ministry level, sees everything.
 */
export function isInCenterScope(
  userCenterId: string | null,
  targetCenterId: string | null | undefined
): boolean {
  if (userCenterId === null) return true;
  return !!targetCenterId && targetCenterId === userCenterId;
}
