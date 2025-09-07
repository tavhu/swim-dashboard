import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;
  const body = await readBody(event);

  // Security Check:
  // If the user has a serviceCenterID, they can only upsert to their own center.
  // An admin (no serviceCenterID) can upsert to any center provided in the body.
  if (user.serviceCenterID && user.serviceCenterID !== body.serviceCenterID) {
    setResponseStatus(event, 403);
    return {
      error: "Forbidden. You do not have permission to perform this action.",
    };
  }

  try {
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
