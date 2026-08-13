export default eventHandler(async (event) => {
  const user = await requireAuth(event);

  try {
    if (!user.roleId) {
      return { permissions: [] };
    }

    const rolePermissions = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: user.roleId,
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
      // `granted` is the write column. This previously read `p.read`, which
      // handed write/update/delete to anyone with read-only access.
      const canWrite = p.granted;

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
