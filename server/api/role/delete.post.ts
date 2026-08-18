/**
 * Deletes a role, and the permission rows hanging off it.
 *
 * Guarded: this took any session and deleted any role by id. Deleting your own
 * role is refused even for Super Admin — it would leave the system with no
 * account able to administer it.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  const body = await readBody(event);

  await assertMayAdministerRole(event, caller, body?.id);

  try {
    // A role still assigned to accounts cannot simply vanish: those users would
    // be left with a dangling userRoleID and no grants at all.
    const inUse = await event.context.prisma.user.count({ where: { userRoleID: body?.id } });
    if (inUse > 0) {
      setResponseStatus(event, 409);
      return { error: errorMessage(event, `តួនាទីនេះកំពុងប្រើដោយគណនី ${inUse}`) };
    }

    await event.context.prisma.roleToResource.deleteMany({ where: { roleID: body?.id } });
    await event.context.prisma.role.delete({ where: { id: body?.id } });

    setResponseStatus(event, 201);
    return { message: "delete success" };
  } catch (e: any) {
    console.error("[role/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the role" };
  }
});
