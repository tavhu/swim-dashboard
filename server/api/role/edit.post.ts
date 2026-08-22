import { SUPER_ADMIN_ROLE } from "../../utils/roleGuard";
import { writeActivityLog } from "../../utils/activityLog";

/**
 * Renames a role. Guarded the same way as create and delete: only Super Admin,
 * never your own role, never the Super Admin role, and the Super Admin name
 * stays reserved so an existing role cannot be renamed into it.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  const body = await readBody(event);

  await assertMayAdministerRole(event, caller, body?.id);

  const name = String(body?.roleName ?? "").trim();
  if (!name) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "សូមបញ្ចូលឈ្មោះតួនាទី") };
  }
  if (name.toLowerCase() === SUPER_ADMIN_ROLE.toLowerCase()) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "ឈ្មោះតួនាទី Super Admin ត្រូវបានបម្រុងទុក") };
  }

  try {
    await event.context.prisma.role.update({
      where: { id: body.id },
      data: { name, description: body?.description },
    });
    setResponseStatus(event, 201);
    await writeActivityLog(event, {
      action: "UPDATE",
      entityType: "ROLE",
      entityId: body.id,
      summary: `Renamed role to ${name}`,
    });
    return { message: "Role updated" };
  } catch (e: any) {
    if (e?.code === "P2002") {
      setResponseStatus(event, 409);
      return { error: errorMessage(event, "ឈ្មោះតួនាទីនេះមានរួចហើយ") };
    }
    console.error("[role/edit]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not update the role" };
  }
});
