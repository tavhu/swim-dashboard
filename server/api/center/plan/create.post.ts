import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { serviceCenterID, yearPlan, actvityPlan, note, filePath } = await readBody(event);

  // Basic validation
  if (!serviceCenterID || !yearPlan || !actvityPlan) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: serviceCenterID, yearPlan, and actvityPlan are required.',
    });
  }

  try {
    const newPlan = await prisma.centerPlan.create({
      data: {
        serviceCenterID,
        yearPlan,
        actvityPlan,
        note,
        filePath,
      },
    });

    return {
      statusCode: 201, // 201 Created
      plan: newPlan,
    };
  } catch (error: any) {
    console.error('Error creating center plan:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Error creating center plan.',
    });
  }
});
