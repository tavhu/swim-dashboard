import { assertRoleAdmin } from "../../utils/roleGuard";

/**
 * Every (role, resource) grant, which is what the permission grid renders.
 *
 * Guarded: this returned the whole access-control map to any signed-in account.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  assertRoleAdmin(caller);

  try {
    const data = await event.context.prisma.roleToResource.findMany({
      select: { roleID: true, resourceID: true, granted: true, read: true },
    });
    setResponseStatus(event, 200);
    return { data };
  } catch (e: any) {
    console.error("[role/getRoleToResource]", e);
    setResponseStatus(event, 412);
    return { data: [], error: e?.message ?? "Request failed" };
  }
});
