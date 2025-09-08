import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { id, serviceCenterID, yearPlan, actvityPlan, note, filePath } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required for updating.',
    });
  }

  // Basic validation
  if (!serviceCenterID || !yearPlan || !actvityPlan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: serviceCenterID, yearPlan, and actvityPlan are required.',
    });
  }

  try {
    const updatedPlan = await prisma.centerPlan.update({
      where: { id },
      data: {
        serviceCenterID,
        yearPlan,
        actvityPlan,
        note,
        filePath,
      },
    });

    return {
      statusCode: 200, // 200 OK
      plan: updatedPlan,
    };
  } catch (error: any) {
    // Handle cases where the record to update is not found
    if (error.code === 'P2025') { 
      throw createError({
        statusCode: 404,
        statusMessage: 'Plan not found.',
      });
    }
    console.error('Error updating center plan:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating center plan.',
    });
  }
});
