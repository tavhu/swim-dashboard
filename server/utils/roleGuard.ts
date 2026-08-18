import type { H3Event } from "h3";
import type { AuthUser } from "./authorize";

/**
 * Who may administer roles and permissions.
 *
 * The endpoints under /api/role checked only that *a* session existed, and the
 * policy middleware's own check is advisory for these paths, so any signed-in
 * account could rewrite any role's permissions — including its own — or delete a
 * role outright. That is the whole access-control model in one request.
 *
 * The rules, in the order they are applied:
 *
 *   1. Only the Super Admin role may write roles or permissions at all. This is
 *      what "Admin cannot change roles and permissions, and cannot create a
 *      Super Admin" reduces to: if Admin cannot write the grid, it cannot grant
 *      anything to anyone, itself included.
 *   2. A role may never edit itself, Super Admin included for the destructive
 *      cases. Super Admin keeps the ability to adjust its own grid because it is
 *      the only role that can, and locking it out is unrecoverable — but it may
 *      not delete itself, which would leave the system with no administrator.
 *   3. The Super Admin role may not be modified by anyone else, which is
 *      implied by (1) but stated separately so it survives (1) being relaxed.
 */
export const SUPER_ADMIN_ROLE = "Super Admin";

export function isSuperAdmin(user: AuthUser): boolean {
  return user.roleName === SUPER_ADMIN_ROLE;
}

/** Throws 403 unless the caller may administer roles at all. */
export function assertRoleAdmin(event: H3Event, user: AuthUser): void {
  if (isSuperAdmin(user)) return;
  throw createError({
    statusCode: 403,
    statusMessage: errorMessage(event, "មានតែ Super Admin ប៉ុណ្ណោះដែលអាចកែតួនាទី និងសិទ្ធិបាន"),
  });
}

/**
 * Throws unless the caller may act on this particular role.
 *
 * `allowSelf` is true for editing a role's permission grid — Super Admin has to
 * be able to adjust its own, because no other role can — and false for renaming
 * or deleting, where changing your own role out from under yourself is how an
 * administrator locks themselves out.
 */
export async function assertMayAdministerRole(
  event: H3Event,
  user: AuthUser,
  targetRoleId: string | null | undefined,
  opts: { allowSelf?: boolean } = {}
): Promise<void> {
  assertRoleAdmin(event, user);

  if (!targetRoleId) return;

  if (targetRoleId === user.roleId && !opts.allowSelf) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage(event, "មិនអាចកែតួនាទីរបស់ខ្លួនឯងបានទេ"),
    });
  }

  const target = await event.context.prisma.role.findUnique({
    where: { id: targetRoleId },
    select: { name: true },
  });
  if (!target) {
    throw createError({ statusCode: 404, statusMessage: errorMessage(event, "រកមិនឃើញតួនាទីនេះទេ") });
  }

  // Belt and braces: even if (1) is relaxed later, Super Admin stays reserved.
  if (target.name === SUPER_ADMIN_ROLE && !isSuperAdmin(user)) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage(event, "មិនអាចកែតួនាទី Super Admin បានទេ"),
    });
  }
}
