import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;

  try {
    // Admins (no service center ID) can see all plans.
    // Users with a service center ID can only see plans for their center.
    const whereClause = user.serviceCenterID
      ? { serviceCenterID: user.serviceCenterID }
      : {};

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
