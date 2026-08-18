import type { H3Event } from "h3";
import { getServerSession } from "#auth";
import type { Action } from "./permissions";
import {
  hasPermission,
  isInCenterScope,
  canAssignRole,
  type Grant,
} from "./permissions";
import { usePrisma } from "./db";

/**
 * Server-side authorization.
 *
 * Permissions were previously checked only in the browser — the route
 * middleware and `stores/permission.ts` decide what to *show*, but the
 * endpoints themselves accept any valid session. These helpers move the check
 * onto the server, where the browser can't reach it.
 *
 * Note: `Grant` and `hasPermission` are intentionally NOT re-exported here.
 * Nitro auto-imports everything under server/utils, so re-exporting would
 * collide with `permissions.ts`. Import those from "./permissions" directly.
 */

export interface AuthUser {
  id: string;
  username: string;
  status: boolean;
  roleId: string | null;
  roleName: string | null;
  /** null means the user isn't tied to one centre and may see all of them. */
  serviceCenterID: string | null;
  organisationID: string | null;
  grants: Grant[];
}

declare module "h3" {
  interface H3EventContext {
    auth?: AuthUser;
  }
}

/** The auth handler puts the user id on both `id` and `sub`. */
function sessionUserId(session: unknown): string | null {
  const s = session as Record<string, unknown> | null;
  if (!s) return null;
  const id = s.id ?? s.sub;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/**
 * Resolve the signed-in user together with their grants, cached on the event
 * so repeated calls in one request hit the database once.
 *
 * Handlers should use this rather than calling `getServerSession` again —
 * a second call within the same request can return null.
 */
export async function getAuthUser(event: H3Event): Promise<AuthUser | null> {
  if (event.context.auth) return event.context.auth;

  const session = await getServerSession(event);
  const userId = sessionUserId(session);
  if (!userId) return null;

  // Not `event.context.prisma`: this runs from middleware that may execute
  // before server/middleware/prisma.ts has populated the context.
  const row = await usePrisma(event).user.findUnique({
    where: { id: userId },
    select: {
      // Deliberately limited to columns present in every version of this
      // schema. `organisationID` is newer, and selecting it made this throw
      // against an older database — which took down /api/user/permissions and
      // left every signed-in user looking unprivileged. Authentication must
      // not be the thing that breaks when a migration is outstanding.
      id: true,
      username: true,
      status: true,
      userRoleID: true,
      serviceCenterID: true,
      Role: {
        select: {
          name: true,
          resource: {
            select: {
              read: true,
              granted: true,
              Resource: { select: { frontEndURL: true } },
            },
          },
        },
      },
    },
  });
  if (!row) return null;

  const user: AuthUser = {
    id: row.id,
    username: row.username,
    status: row.status,
    roleId: row.userRoleID,
    roleName: row.Role?.name ?? null,
    serviceCenterID: row.serviceCenterID,
    organisationID: (row as any).organisationID ?? null,
    grants: (row.Role?.resource ?? [])
      .filter((r: any) => !!r.Resource?.frontEndURL)
      .map((r: any) => ({
        resource: r.Resource.frontEndURL as string,
        read: r.read,
        granted: r.granted,
      })),
  };

  event.context.auth = user;
  return user;
}

export function userCan(
  user: AuthUser,
  resource: string,
  action: Action
): boolean {
  return hasPermission(user.grants, resource, action);
}

/** Throws 401 if there is no valid session, or the account has been disabled. */
export async function requireAuth(event: H3Event): Promise<AuthUser> {
  const user = await getAuthUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }
  if (!user.status) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage(event, "គណនីត្រូវបានបិទ! សូមទំនាក់ទំនងអ្នកគ្រប់គ្រង"),
    });
  }
  return user;
}

/** Throws 403 unless the caller holds `action` on `resource`. */
export async function requirePermission(
  event: H3Event,
  resource: string,
  action: Action
): Promise<AuthUser> {
  const user = await requireAuth(event);
  if (!userCan(user, resource, action)) {
    throw createError({
      statusCode: 403,
      statusMessage: errorMessage(event, "អ្នកមិនមានសិទ្ធិសម្រាប់សកម្មភាពនេះទេ"),
    });
  }
  return user;
}

/**
 * Which role ids are gated by a "may assign this role" resource row.
 *
 * A `Resources.frontEndURL` holding a role id is the app's existing convention
 * for that permission (see `/api/role/get`, which filters the role dropdown
 * with it).
 */
async function gatedRoleIds(event: H3Event): Promise<string[]> {
  const [resources, roles] = await Promise.all([
    usePrisma(event).resources.findMany({ select: { frontEndURL: true } }),
    usePrisma(event).role.findMany({ select: { id: true } }),
  ]);
  const roleIds = new Set(roles.map((r) => r.id));
  return resources
    .map((r) => r.frontEndURL)
    .filter((u): u is string => !!u && roleIds.has(u));
}

/**
 * Throws 403 unless the caller may assign `roleId`.
 *
 * Without this, `/api/user/upsert` takes `userRoleID` straight from the request
 * body, so any account that can reach the endpoint can promote itself to Super
 * Admin — the role dropdown was the only check.
 */
export async function assertCanAssignRole(
  event: H3Event,
  user: AuthUser,
  roleId: string | null | undefined
): Promise<void> {
  if (!roleId) return;
  if (canAssignRole(user.grants, roleId, await gatedRoleIds(event))) return;
  throw createError({
    statusCode: 403,
    statusMessage: errorMessage(event, "អ្នកមិនមានសិទ្ធិផ្តល់តួនាទីនេះទេ"),
  });
}

/**
 * Multi-tenancy guard. A user with a `serviceCenterID` may only touch records
 * belonging to that centre; `null` is unscoped (ministry level).
 */
export function assertCenterScope(
  event: H3Event,
  user: AuthUser,
  targetCenterId: string | null | undefined
): void {
  if (isInCenterScope(user.serviceCenterID, targetCenterId)) return;
  throw createError({
    statusCode: 403,
    statusMessage: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ"),
  });
}

/** Prisma `where` fragment restricting a query to the caller's centre. */
export function centerScopeFilter(user: AuthUser): { serviceCenterID?: string } {
  return user.serviceCenterID === null
    ? {}
    : { serviceCenterID: user.serviceCenterID };
}
