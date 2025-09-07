import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  try {
    // CORRECTED: The resource name was wrong. It should be 'center-documentation'.
    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: 'center-documentation' },
    });

    if (!resource) {
        setResponseStatus(event, 404);
        return { error: "Resource 'center-documentation' not found." };
    }

    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    if (!permission || !permission.read) {
        setResponseStatus(event, 403);
        return { error: "Forbidden. You do not have permission to view this content." };
    }

    let whereClause = {};
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
