import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;
  const body = await readBody(event);

  try {
    // Find the resource for the center plan upload page
    const resource = await event.context.prisma.Resource.findFirst({
        where: { frontEndURL: 'center-plan' },
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

    // Block access if no permission
    if (!permission?.granted) {
        setResponseStatus(event, 403);
        return { error: "Forbidden. You do not have permission to perform this action." };
    }

    // Security Check:
    // If the user does not have 'granted' permission and has a serviceCenterID,
    // they can only upsert to their own center.
    if (!permission.granted && user.serviceCenterID && user.serviceCenterID !== body.serviceCenterID) {
        setResponseStatus(event, 403);
        return {
            error: "Forbidden. You do not have permission to upload to this service center.",
        };
    }

    const planData = {
      actvityPlan: body.actvityPlan,
      note: body.note,
      yearPlan: body.yearPlan,
      filePath: body.filePath,
      serviceCenterID: body.serviceCenterID,
    };

    const upsertedPlan = await event.context.prisma.CenterPlan.create({
      data: planData,
    });

    return { status: "success", data: upsertedPlan };
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while creating or updating the plan.",
    };
  }
});
