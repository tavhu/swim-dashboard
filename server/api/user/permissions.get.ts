import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = (await getServerSession(event)) as any;

  if (!session) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  try {
    const dbUser = await event.context.prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!dbUser || !dbUser.userRoleID) {
      return { permissions: [] };
    }

    const rolePermissions = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: dbUser.userRoleID,
      },
      select: {
        // CORRECTED: Use 'resource' (camelCase) to match the schema
        Resource: {
          select: {
            frontEndURL: true,
          },
        },
        read: true,
        granted: true,
      },
    });

    // RE-IMPLEMENTED: Create a full permission object for the frontend.
    const permissions = rolePermissions.map((p) => {
      // The backend authorizes write operations (like upsert) using the 'read' flag.
      // Therefore, we will tell the frontend that write/update/del permissions are true if read is true.
      // This makes the frontend `hasWritePermission` check work correctly.
      const canWrite = p.read;

      return {
        frontEndURL: p.Resource?.frontEndURL,
        read: p.read,
        granted: p.granted,
        // Add write, update, and del so the frontend permission store is complete.
        write: canWrite,
        update: canWrite,
        del: canWrite,
      };
    });

    return { permissions };
  } catch (e) {
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching user permissions.",
    };
  }
});
