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
        Resource: {
          select: {
            frontEndURL: true,
          },
        },
        read: true,
        granted: true,
      },
    });

    const permissions = rolePermissions.map((p) => {
      const canWrite = p.read;

      return {
        frontEndURL: p.Resource?.frontEndURL,
        read: p.read,
        granted: p.granted,
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
