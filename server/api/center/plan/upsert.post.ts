import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    const newPlan = await event.context.prisma.CenterPlan.create({
      data: {
        actvityPlan: body?.actvityPlan,
        note: body?.note,
        yearPlan: body?.yearPlan,
        filePath: body?.filePath,
        serviceCenterID: body?.serviceCenterID,
      },
    });

    setResponseStatus(event, 201);
    return { message: "Plan created successfully", plan: newPlan };
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while creating the plan.",
    };
  }
});
