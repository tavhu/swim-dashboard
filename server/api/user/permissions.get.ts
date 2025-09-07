import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  console.log("--- [API] /api/user/permissions.get.ts ---");
  const session = (await getServerSession(event)) as any;

  if (!session) {
    console.log("[DEBUG] No session found. Unauthenticated.");
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }
  console.log("[DEBUG] Session found for user ID:", session.id);

  try {
    const dbUser = await event.context.prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!dbUser || !dbUser.userRoleID) {
      console.log("[DEBUG] DB user not found or has no userRoleID. user:", dbUser);
      return { permissions: [] };
    }
    console.log("[DEBUG] User found in DB. RoleID:", dbUser.userRoleID);

    const rolePermissions = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: dbUser.userRoleID,
      },
      select: {
        resource: {
          select: {
            frontEndURL: true,
          },
        },
        read: true,
        granted: true,
      },
    });

    console.log("[DEBUG] Raw permissions from DB:", JSON.stringify(rolePermissions, null, 2));

    const permissions = rolePermissions.map((p) => {
      const canWrite = p.read;

      return {
        frontEndURL: p.resource?.frontEndURL,
        read: p.read,
        granted: p.granted,
        write: canWrite,
        update: canWrite,
        del: canWrite,
      };
    });

    console.log("[DEBUG] Final permissions object sent to client:", JSON.stringify(permissions, null, 2));
    console.log("--- [API] End /api/user/permissions.get.ts ---");
    return { permissions };
    
  } catch (e) {
    console.error("[DEBUG] Error in permissions endpoint:", e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching user permissions.",
    };
  }
});
