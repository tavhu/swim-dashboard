export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma;
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required for deletion.',
    });
  }

  // Whose plan this is decides who may remove it.
  const caller = await getAuthUser(event);
  if (caller?.serviceCenterID) {
    const plan = await prisma.centerPlan.findUnique({
      where: { id },
      select: { serviceCenterID: true },
    });
    if (plan && plan.serviceCenterID !== caller.serviceCenterID) {
      throw createError({
        statusCode: 403,
        statusMessage: errorMessage(event, 'អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ'),
      });
    }
  }

  try {
    const plan = await prisma.centerPlan.findUnique({
      where: { id },
      select: { serviceCenterID: true, yearPlan: true },
    });

    await prisma.centerPlan.delete({
      where: { id },
    });

    const { writeActivityLog } = await import("../../../../utils/activityLog");
    await writeActivityLog(event, {
      action: "DELETE",
      entityType: "CENTER",
      entityId: id,
      summary: `Deleted centre plan${plan?.yearPlan ? ` for year ${plan.yearPlan}` : ""}`,
      serviceCenterID: plan?.serviceCenterID ?? null,
    });

    return {
      statusCode: 204, // 204 No Content
    };
  } catch (error: any) {
    // Handle cases where the record to delete is not found
    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found.',
      });
    }
    console.error('Error deleting center plan:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error deleting center plan.',
    });
  }
});
