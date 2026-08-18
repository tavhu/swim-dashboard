export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma;
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    });
  }

  try {
    // Scoped like every other read: a plan is only visible to its own centre.
    const caller = await getAuthUser(event);
    const plan = await prisma.centerPlan.findFirst({
      where: {
        id,
        ...(caller?.serviceCenterID ? { serviceCenterID: caller.serviceCenterID } : {}),
      },
    });

    if (!plan) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found',
      });
    }

    return { plan };
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error fetching plan',
    });
  }
});
