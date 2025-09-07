import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  try {
    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: 'center-centerdocumentation' },
    });

    if (!resource) {
        setResponseStatus(event, 404);
        return { error: "Resource 'center-centerdocumentation' not found." };
    }

    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    // If no permission record exists, or read is explicitly false, deny access.
    if (!permission || !permission.read) {
        setResponseStatus(event, 403);
        return { error: "Forbidden. You do not have permission to view this content." };
    }

    let whereClause = {};
    // If permission is not globally granted, and the user is tied to a specific center, filter by that center.
    if (permission.granted === false && user.serviceCenterID) {
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
