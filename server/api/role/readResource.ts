import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

   console.log(session)
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  try {
    // First, fetch the user from the database using the session's user ID
    const dbUser = await event.context.prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser || !dbUser.userRoleID) {
      setResponseStatus(event, 403);
      return { error: "User role not found or user does not exist." };
    }

    const userRoleID = dbUser.userRoleID;

    // 1. Find all resource IDs the user's role is allowed to read
    const allowedResources = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: userRoleID,
        read: true,
      },
      select: {
        resourceID: true,
      },
    });

    const allowedResourceIds = allowedResources.map((r) => r.resourceID);

    if (allowedResourceIds.length === 0) {
      // If no resources are allowed, return an empty array
      return { data: [] };
    }

    // 2. Fetch the actual resources based on the allowed IDs
    const data = await event.context.prisma.resources.findMany({
      where: {
        id: {
          in: allowedResourceIds,
        },
      },
    });

    setResponseStatus(event, 200);
    return { data };
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: "An internal server error occurred.",
    };
  }
});
