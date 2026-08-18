/**
 * Sets one cell of the permission grid.
 *
 * This checked only that a session existed, so any signed-in account could grant
 * itself write on anything — the entire access-control model was writable by
 * everyone who could log in.
 *
 * `allowSelf` is true here: Super Admin must be able to adjust its own grid,
 * because no other role may, and there would otherwise be no way back from a
 * mistake.
 */
import { SUPER_ADMIN_ROLE } from "../../utils/roleGuard";

export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  const body = await readBody(event);

  await assertMayAdministerRole(event, caller, body?.roleID, { allowSelf: true });

  // Super Admin's grid is fixed at full access.
  //
  // Not paternalism: the permission screen is itself a permission. A Super Admin
  // who denies themselves `role` cannot grant it back, and no other role may —
  // the system would be left with no account able to administer it and no way to
  // recover short of editing the database.
  const target = await event.context.prisma.role.findUnique({
    where: { id: body?.roleID },
    select: { name: true },
  });
  if (target?.name === SUPER_ADMIN_ROLE) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "សិទ្ធិរបស់ Super Admin មិនអាចកែបានទេ") };
  }

  const granted = body?.granted === true;
  // Write implies read: a cell that can be edited can be seen, and storing the
  // two independently lets the grid represent a state the checks do not.
  const read = granted || body?.read === true;

  try {
    await event.context.prisma.roleToResource.upsert({
      where: { roleID_resourceID: { resourceID: body?.resourceID, roleID: body?.roleID } },
      update: { granted, read },
      create: { roleID: body?.roleID, resourceID: body?.resourceID, granted, read },
    });

    setResponseStatus(event, 201);
    return { message: "Role to Resource Created" };
  } catch (e: any) {
    console.error("[role/updateRoleToResource]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the permission" };
  }
});
