import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = (await getServerSession(event)) as any;

  if (!session) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  try {
    // Correctly fetch the user from the database
    const dbUser = await event.context.prisma.user.findUnique({
      where: { id: session.id },
    });

    // If user or their role is not found, they have no permissions.
    if (!dbUser || !dbUser.userRoleID) {
      return { permissions: [] };
    }

    // Correctly fetch permissions based on the actual schema
    const rolePermissions = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: dbUser.userRoleID,
      },
      // CORRECTED: Select only the fields that exist in your schema
      select: {
        Resource: {
          select: {
            frontEndURL: true,
          },
        },
        read: true, // This field exists
        granted: true, // This field exists
      },
    });

    // CORRECTED: Map the result to include only the existing fields
    const permissions = rolePermissions.map((p) => ({
      frontEndURL: p.Resource?.frontEndURL,
      read: p.read,
      granted: p.granted,
    }));

    return { permissions };
  } catch (e) {
    // No logs as requested
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching user permissions.",
    };
  }
});
