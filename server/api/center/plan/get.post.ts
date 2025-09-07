import { getServerSession } from "#auth";
import { URL } from 'url';

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  // Dynamically determine the resource based on the page that made the request.
  const referer = event.node.req.headers.referer;
  if (!referer) {
    setResponseStatus(event, 400);
    return { error: "Request is missing the 'referer' header." };
  }

  // Convert the referer URL (e.g., '/center/centerdocumentation') to the frontEndURL format (e.g., 'center-centerdocumentation')
  const refererUrl = new URL(referer);
  const frontEndURL = refererUrl.pathname.substring(1).replace(/\//g, '-');

  if (!frontEndURL) {
    setResponseStatus(event, 400);
    return { error: "Could not determine the resource from the referer URL." };
  }

  try {
    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: frontEndURL },
    });

    if (!resource) {
        setResponseStatus(event, 404);
        return { error: `Resource '${frontEndURL}' not found.` };
    }

    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    if (!permission || !permission.read) {
        setResponseStatus(event, 403);
        return { error: `Forbidden. You do not have permission to view the resource '${frontEndURL}'.` };
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
