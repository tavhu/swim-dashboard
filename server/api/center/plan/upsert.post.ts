import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const { id, serviceCenterID, yearPlan, actvityPlan, note, filePath } = body;

  // Basic validation
  if (!serviceCenterID || !yearPlan || !actvityPlan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: serviceCenterID, yearPlan, and actvityPlan are required.',
    });
  }

  try {
    // If an ID is provided, update the existing record. Otherwise, create a new one.
    const result = await prisma.centerPlan.upsert({
      where: { id: id || '' }, // Provide a dummy string for id if it's null/undefined
      update: {
        serviceCenterID,
        yearPlan,
        actvityPlan,
        note,
        filePath,
      },
      create: {
        serviceCenterID,
        yearPlan,
        actvityPlan,
        note,
        filePath,
      },
    });

    return {
      statusCode: id ? 200 : 201, // 200 OK for update, 201 Created for create
      plan: result,
    };
  } catch (error: any) {
    console.error('Error in upsert operation:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error in upsert operation.',
    });
  }
});
