import { assertRoleAdmin } from "../../utils/roleGuard";
import { APP_RESOURCES } from "../../utils/appResources";

/**
 * Every page the permission grid can grant, with the metadata the grid needs to
 * group and label it.
 *
 * This used to return only the resources the *caller's own role* could read,
 * which is the wrong set for an editor: a page you cannot see is exactly the one
 * you might need to grant to someone else. It returns the full list now, and is
 * restricted to role administrators instead.
 *
 * Role-gate rows — a Resources row whose frontEndURL is a role id — are returned
 * separately. They are not pages, and listing them among the pages is what made
 * the old grid show two rows called "មានសិទ្ធបង្កើ Admin" with no page behind
 * them.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  assertRoleAdmin(caller);

  try {
    const [rows, roles] = await Promise.all([
      event.context.prisma.resources.findMany({
        select: { id: true, name: true, frontEndURL: true },
      }),
      event.context.prisma.role.findMany({ select: { id: true, name: true } }),
    ]);

    const meta = new Map(APP_RESOURCES.map((r) => [r.route, r]));
    const roleNames = new Map(roles.map((r) => [r.id, r.name]));

    const pages = rows
      .filter((r) => r.frontEndURL && meta.has(r.frontEndURL))
      .map((r) => {
        const m = meta.get(r.frontEndURL!)!;
        return {
          id: r.id,
          name: r.name,
          frontEndURL: r.frontEndURL,
          group: m.group,
          readOnlyPage: !!m.readOnlyPage,
          order: APP_RESOURCES.findIndex((x) => x.route === r.frontEndURL),
        };
      })
      .sort((a, b) => a.order - b.order);

    const roleGates = rows
      .filter((r) => r.frontEndURL && roleNames.has(r.frontEndURL))
      .map((r) => ({
        id: r.id,
        name: r.name,
        frontEndURL: r.frontEndURL,
        roleName: roleNames.get(r.frontEndURL!) ?? null,
      }));

    setResponseStatus(event, 200);
    return { data: pages, roleGates };
  } catch (e: any) {
    console.error("[role/readResource]", e);
    setResponseStatus(event, 500);
    return { data: [], roleGates: [], error: e?.message ?? "Request failed" };
  }
});
