import { assertRoleAdmin, SUPER_ADMIN_ROLE } from "../../utils/roleGuard";
import { writeActivityLog } from "../../utils/activityLog";

/**
 * Creates a role. Only Super Admin may, and the Super Admin name is reserved —
 * otherwise "cannot create a Super Admin" is one spelling away from being
 * bypassed by creating a second role with that name.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  assertRoleAdmin(event, caller);

  const body = await readBody(event);
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
    await event.context.prisma.role.create({
      data: { name, description: body?.description },
    });
    setResponseStatus(event, 201);
    await writeActivityLog(event, {
      action: "CREATE",
      entityType: "ROLE",
      summary: `Created role ${name}`,
    });
    return { message: "Role created" };
  } catch (e: any) {
    if (e?.code === "P2002") {
      setResponseStatus(event, 409);
      return { error: errorMessage(event, "ឈ្មោះតួនាទីនេះមានរួចហើយ") };
    }
    console.error("[role/create]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not create the role" };
  }
});
