import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  try {
    // Find the resource for center documentation
    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: 'center-centerdocumentation' },
    });

    if (!resource) {
        setResponseStatus(event, 404);
        return { error: "Resource not found." };
    }

    // Check user's permission for this resource
    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    // Block access if no read permission
    if (!permission?.read) {
        setResponseStatus(event, 403);
        return { error: "Forbidden. You do not have permission to view this content." };
    }

    // Determine the query's 'where' clause based on permissions
    let whereClause = {};
    // If permission is not 'granted', and the user has a service center, restrict the query
    if (!permission.granted && user.serviceCenterID) {
      whereClause = { serviceCenterID: user.serviceCenterID };
    }

    const plans = await event.context.prisma.CenterPlan.findMany({
      where: whereClause,
      include: {
        ServiceCenter: true,
      },
    });

    return { plans };
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching the plans.",
    };
  }
});
