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
    const resource = await event.context.prisma.Resource.findFirst({
        where: { frontEndURL: 'center-plan' },
    });

    if (!resource) {
        setResponseStatus(event, 404);
        return { error: "Resource 'center-plan' not found." };
    }

    const permission = await event.context.prisma.RoleToResource.findFirst({
        where: {
            roleID: user.roleID,
            resourceID: resource.id,
        },
    });

    // If no permission record exists, or granted is explicitly false, deny action.
    if (!permission || !permission.granted) {
        setResponseStatus(event, 403);
        return { error: "Forbidden. You do not have permission to perform this action." };
    }

    // Security Check: If the user is not a full admin and is assigned to a center,
    // they can only upload to their own center.
    if (permission.granted === false && user.serviceCenterID && user.serviceCenterID !== body.serviceCenterID) {
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
