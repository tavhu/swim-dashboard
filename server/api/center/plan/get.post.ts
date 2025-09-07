import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    const plans = await event.context.prisma.CenterPlan.findMany({
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
