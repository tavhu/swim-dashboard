import { getServerSession } from "#auth";
import { URL } from "url";

export default eventHandler(async (event) => {
  const session = (await getServerSession(event)) as any;
  if (!session) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const dbUser = await event.context.prisma.user.findUnique({
    where: { id: session.id },
  });

  if (!dbUser) {
    setResponseStatus(event, 404);
    return { error: "Authenticated user not found in database." };
  }

  const referer = event.node.req.headers.referer;
  if (!referer) {
    setResponseStatus(event, 400);
    return { error: "Request is missing the 'referer' header." };
  }

  const refererUrl = new URL(referer);
  const frontEndURL = refererUrl.pathname.substring(1).replace(/\//g, "-");
  const body = await readBody(event);

  try {
    const resource = await event.context.prisma.resources.findFirst({
      where: { frontEndURL: frontEndURL },
    });

    if (!resource) {
      setResponseStatus(event, 404);
      return { error: `Resource '${frontEndURL}' not found.` };
    }

    const permission = await event.context.prisma.roleToResource.findFirst({
      where: {
        roleID: dbUser.userRoleID,
        resourceID: resource.id,
      },
    });

    // CORRECTED: Check for 'read' permission as per the actual schema.
    // This assumes that users who can read the resource can also write to it.
    if (!permission || !permission.read) {
      setResponseStatus(event, 403);
      return {
        error: `Forbidden. You do not have permission to perform this action.`,
      };
    }

    if (permission.granted === false && dbUser.serviceCenterID) {
      if (dbUser.serviceCenterID !== body.serviceCenterID) {
        setResponseStatus(event, 403);
        return {
          error:
            "Forbidden. You do not have permission to create a plan for this service center.",
        };
      }
    }

    const planData = {
      actvityPlan: body.actvityPlan,
      note: body.note,
      yearPlan: body.yearPlan,
      filePath: body.filePath,
      serviceCenterID: body.serviceCenterID,
    };

    const upsertedPlan = await event.context.prisma.centerPlan.create({
      data: planData,
    });

    return { status: "success", data: upsertedPlan };
  } catch (e) {
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while creating or updating the plan.",
    };
  }
});
