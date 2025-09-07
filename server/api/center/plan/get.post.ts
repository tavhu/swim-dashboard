import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  console.log("--- Start /api/center/plan/get ---");

  const session = await getServerSession(event);
  if (!session || !session.user) {
    console.error('API Error: Session not found. User is unauthenticated.');
    setResponseStatus(event, 401);
    console.log("--- End /api/center/plan/get ---");
    return { status: "unauthenticated" };
  }

  const user = session.user as any;
  console.log('User authenticated:', { userID: user.id, roleID: user.roleID, serviceCenterID: user.serviceCenterID });

  try {
    const resourceName = 'center-centerdocumentation';
    console.log(`Looking for resource: '${resourceName}'`);

    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: resourceName },
    });

    if (!resource) {
        console.error(`API Error: Resource '${resourceName}' not found in the database.`);
        setResponseStatus(event, 404);
        console.log("--- End /api/center/plan/get ---");
        return { error: `Resource '${resourceName}' not found.` };
    }

    console.log('Resource found:', { resourceID: resource.id, resourceName: resource.name });

    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    if (!permission) {
        console.error(`API Error: No permission entry found for roleID: ${user.roleID} and resourceID: ${resource.id}`);
        setResponseStatus(event, 403);
        console.log("--- End /api/center/plan/get ---");
        return { error: "Forbidden. You do not have permission to view this content." };
    }

    console.log('Permission record found:', permission);

    if (!permission.read) {
        console.error(`API Error: Permission entry found, but 'read' access is denied for roleID: ${user.roleID}`);
        setResponseStatus(event, 403);
        console.log("--- End /api/center/plan/get ---");
        return { error: "Forbidden. You do not have permission to view this content." };
    }

    console.log("'Read' permission is granted. Proceeding to fetch data.");

    let whereClause = {};
    if (permission.granted === false && user.serviceCenterID) {
      console.log(`User is not globally granted. Filtering by serviceCenterID: ${user.serviceCenterID}`);
      whereClause = { serviceCenterID: user.serviceCenterID };
    } else {
      console.log("User has global grant or no service center. Fetching all plans.");
    }

    const plans = await event.context.prisma.CenterPlan.findMany({
      where: whereClause,
      include: {
        ServiceCenter: true,
      },
    });

    console.log(`Successfully fetched ${plans.length} plans.`);
    console.log("--- End /api/center/plan/get ---");
    return { plans };

  } catch (e) {
    console.error("API Error: A critical error occurred in the try-catch block.", e);
    setResponseStatus(event, 500);
    console.log("--- End /api/center/plan/get ---");
    return {
      error: "An error occurred while fetching the plans.",
    };
  }
});
