import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const { id, serviceCenterID, yearPlan, actvityPlan, note, filePath } = body;

  const data = {
    serviceCenterID,
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

    return {
      statusCode: id ? 200 : 201, // 200 OK for update, 201 Created for create
      plan: result,
    };
  } catch (error: any) {
    console.error('Error in save operation:', error);
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
