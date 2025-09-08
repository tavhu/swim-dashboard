import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    return {
      statusCode: 200,
      statusMessage: 'Successfully fetched services.',
      data: services,
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    });
  }
});
