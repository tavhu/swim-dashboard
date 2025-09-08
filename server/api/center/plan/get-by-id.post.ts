import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID is required',
    });
  }

  try {
    const plan = await prisma.centerPlan.findUnique({
      where: { id },
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
