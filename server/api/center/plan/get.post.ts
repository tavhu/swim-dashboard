import { getServerSession } from "#auth";
import { URL } from 'url';

export default eventHandler(async (event) => {
  console.log("--- [API] Start /api/center/plan/get ---");

  // CORRECTED: The user data is directly on the session object.
  const session = await getServerSession(event) as any;
  if (!session) {
    console.error("[API Error] Session not found. User is unauthenticated.");
    setResponseStatus(event, 401);
    console.log("--- [API] End /api/center/plan/get ---");
    return { status: "unauthenticated" };
  }

  console.log("[API Info] Session authenticated for user ID:", session.id);

  // Step 1: Fetch the full user from the database using the session ID
  const dbUser = await event.context.prisma.user.findUnique({
    where: { id: session.id }, // CORRECTED: Use session.id directly
  });

  if (!dbUser) {
    console.error(`[API Error] User with ID '${session.id}' not found in database.`);
    setResponseStatus(event, 404);
    return { error: "Authenticated user not found in database." };
  }
  console.log("[API Info] Fetched full user from DB:", { userID: dbUser.id, roleID: dbUser.userRoleID, serviceCenterID: dbUser.serviceCenterID });

  const referer = event.node.req.headers.referer;
  console.log(`[API Info] Referer header: ${referer}`);
  if (!referer) {
    console.error("[API Error] Request is missing the 'referer' header.");
    setResponseStatus(event, 400);
    console.log("--- [API] End /api/center/plan/get ---");
    return { error: "Request is missing the 'referer' header." };
  }

  const refererUrl = new URL(referer);
  const frontEndURL = refererUrl.pathname.substring(1).replace(/\//g, '-');
  console.log(`[API Info] Derived frontEndURL: '${frontEndURL}'`);

  if (!frontEndURL) {
    console.error("[API Error] Could not determine the resource from the referer URL.");
    setResponseStatus(event, 400);
    return { error: "Could not determine the resource from the referer URL." };
  }

  try {
    console.log(`[API Info] Querying for resource: '${frontEndURL}'`);
    const resource = await event.context.prisma.Resource.findFirst({
      where: { frontEndURL: frontEndURL },
    });

    if (!resource) {
        console.error(`[API Error] Resource '${frontEndURL}' not found in the database.`);
        setResponseStatus(event, 404);
        return { error: `Resource '${frontEndURL}' not found.` };
    }
    console.log("[API Info] Resource found:", { resourceID: resource.id, resourceName: resource.name });

    console.log(`[API Info] Querying for permission for roleID: ${dbUser.userRoleID} and resourceID: ${resource.id}`);
    const permission = await event.context.prisma.RoleToResource.findFirst({
      where: {
        roleID: dbUser.userRoleID,
        resourceID: resource.id,
      },
    });

    if (!permission || !permission.read) {
        console.error(`[API Error] Permission denied for roleID: ${dbUser.userRoleID} on resource '${frontEndURL}'. Permission record:`, permission);
        setResponseStatus(event, 403);
        return { error: `Forbidden. You do not have permission to view the resource '${frontEndURL}'.` };
    }
    console.log("[API Info] 'Read' permission granted.", { permission });

    let whereClause = {};
    if (permission.granted === false && dbUser.serviceCenterID) {
      console.log(`[API Info] Permission is not global. Filtering by serviceCenterID: ${dbUser.serviceCenterID}`);
      whereClause = { serviceCenterID: dbUser.serviceCenterID };
    } else {
      console.log("[API Info] User has global grant or no service center. Not filtering by serviceCenterID.");
    }

    console.log("[API Info] Fetching CenterPlan data with where clause:", whereClause);
    const plans = await event.context.prisma.CenterPlan.findMany({
      where: whereClause,
      include: {
        ServiceCenter: true,
      },
    });

    console.log(`[API Info] Successfully fetched ${plans.length} plans.`);
    console.log("--- [API] End /api/center/plan/get ---");
    return { plans };

  } catch (e) {
    console.error("[API Critical Error] An unexpected error occurred in the try-catch block:", e);
    setResponseStatus(event, 500);
    console.log("--- [API] End /api/center/plan/get ---");
    return {
      error: "An error occurred while fetching the plans.",
    };
  }
});
