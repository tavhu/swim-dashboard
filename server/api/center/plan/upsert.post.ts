import { getServerSession } from "#auth";
import { URL } from 'url';

export default eventHandler(async (event) => {
  console.log("--- [API] Start /api/center/plan/upsert ---");

  const session = await getServerSession(event) as any;
  if (!session) {
    console.error("[API Error] Session not found. User is unauthenticated.");
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  console.log("[API Info] Session authenticated for user ID:", session.id);

  // CORRECTED: Fetch the full user from the database using the session ID
  const dbUser = await event.context.prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!dbUser) {
    console.error(`[API Error] User with ID '${session.id}' not found in database.`);
    setResponseStatus(event, 404);
    return { error: "Authenticated user not found in database." };
  }
  console.log("[API Info] Fetched full user from DB:", { userID: dbUser.id, roleID: dbUser.userRoleID, serviceCenterID: dbUser.serviceCenterID });

  // CORRECTED: Dynamically determine the resource based on the page that made the request.
  const referer = event.node.req.headers.referer;
  if (!referer) {
    console.error("[API Error] Request is missing the 'referer' header.");
    setResponseStatus(event, 400);
    return { error: "Request is missing the 'referer' header." };
  }

  const refererUrl = new URL(referer);
  const frontEndURL = refererUrl.pathname.substring(1).replace(/\//g, '-');
  console.log(`[API Info] Derived frontEndURL: '${frontEndURL}'`);

  const body = await readBody(event);

  try {
    // CORRECTED: Prisma model names are camelCase
    const resource = await event.context.prisma.resource.findFirst({
      where: { frontEndURL: frontEndURL },
    });

    if (!resource) {
        console.error(`[API Error] Resource '${frontEndURL}' not found in the database.`);
        setResponseStatus(event, 404);
        return { error: `Resource '${frontEndURL}' not found.` };
    }
    console.log("[API Info] Resource found:", { resourceID: resource.id, resourceName: resource.name });

    // CORRECTED: Use dbUser.userRoleID and correct prisma model name
    const permission = await event.context.prisma.roleToResource.findFirst({
      where: {
        roleID: dbUser.userRoleID,
        resourceID: resource.id,
      },
    });

    // CORRECTED: Check for the 'create' permission specifically for this action
    if (!permission || !permission.create) {
        console.error(`[API Error] 'Create' permission denied for roleID: ${dbUser.userRoleID} on resource '${frontEndURL}'.`);
        setResponseStatus(event, 403);
        return { error: `Forbidden. You do not have permission to create this resource.` };
    }
    console.log("[API Info] 'Create' permission granted.", { permission });

    // CORRECTED: Use the fetched dbUser for security checks
    if (permission.granted === false && dbUser.serviceCenterID) {
      if (dbUser.serviceCenterID !== body.serviceCenterID) {
            console.error("[API Error] Forbidden. User is attempting to create a plan for a different service center.");
            setResponseStatus(event, 403);
            return { error: "Forbidden. You do not have permission to create a plan for this service center." };
        }
    }

    const planData = {
      actvityPlan: body.actvityPlan,
      note: body.note,
      yearPlan: body.yearPlan,
      filePath: body.filePath,
      serviceCenterID: body.serviceCenterID,
    };
    
    // CORRECTED: Prisma model names are camelCase
    const upsertedPlan = await event.context.prisma.centerPlan.create({
      data: planData,
    });

    console.log("[API Info] Successfully created plan with ID:", upsertedPlan.id);
    console.log("--- [API] End /api/center/plan/upsert ---");
    return { status: "success", data: upsertedPlan };

  } catch (e) {
    console.error("[API Critical Error] An unexpected error occurred in the try-catch block:", e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while creating or updating the plan.",
    };
  }
});
