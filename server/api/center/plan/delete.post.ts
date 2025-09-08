import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required for deletion.',
    });
  }

  try {
    await prisma.centerPlan.delete({
      where: { id },
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
