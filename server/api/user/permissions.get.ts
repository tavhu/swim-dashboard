import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  if (!user.roleID) {
    return { permissions: [] };
  }

  try {
    const rolePermissions = await event.context.prisma.RoleToResource.findMany({
      where: {
        roleID: user.roleID,
        OR: [{ read: true }, { granted: true }],
      },
      include: {
        Resource: true,
      },
    });

    const permissions = rolePermissions
      .map((p) => p.Resource?.frontEndURL)
      .filter(Boolean); // Filter out any null/undefined URLs

    return { permissions };
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching user permissions.",
    };
  }
});
