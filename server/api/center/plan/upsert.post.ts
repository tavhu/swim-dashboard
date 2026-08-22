export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma;
  const body = await readBody(event);

  const { id, serviceCenterID, yearPlan, actvityPlan, note, filePath } = body;

  // A centre-bound user writes plans for their own centre only. Taking
  // serviceCenterID from the body let one centre file a plan against another.
  const ownCentre = await resolveWriteCentre(event, serviceCenterID);
  const data = {
    serviceCenterID: ownCentre,
    yearPlan,
    actvityPlan,
    note,
    filePath,
  };

  // Basic validation
  if (!data.serviceCenterID || !data.yearPlan || !data.actvityPlan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: serviceCenterID, yearPlan, and actvityPlan are required.',
    });
  }

  try {
    let result;
    if (id) {
      // If an ID is provided, update the existing record.
      result = await prisma.centerPlan.update({
        where: { id },
        data,
      });
    } else {
      // Otherwise, create a new record.
      result = await prisma.centerPlan.create({
        data,
      });
    }

    const { writeActivityLog } = await import("../../../utils/activityLog");
    await writeActivityLog(event, {
      action: id ? "UPDATE" : "CREATE",
      entityType: "CENTER",
      entityId: result.id,
      summary: `${id ? "Updated" : "Created"} centre plan for year ${yearPlan}`,
      serviceCenterID: ownCentre,
    });

    return {
      statusCode: id ? 200 : 201, // 200 OK for update, 201 Created for create
      plan: result,
    };
  } catch (error: any) {
    if (error.code === 'P2025') {
       throw createError({
        statusCode: 404,
        statusMessage: `Plan with ID ${id} not found.`,
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An error occurred during the save operation.',
    });
  }
});
