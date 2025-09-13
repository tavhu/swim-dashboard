import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

  if (!session) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  try {
    const userRoleID = session?.user?.userRoleID;

    if (!userRoleID) {
      setResponseStatus(event, 403);
      return { error: "User role not found." };
    }

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

    const allowedResourceIds = allowedResources.map(r => r.resourceID);

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
