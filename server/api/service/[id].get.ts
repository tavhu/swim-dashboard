import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const serviceId = event.context.params?.id;

    if (!serviceId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service ID is required.',
      });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Service not found.',
      });
    }

    return {
      statusCode: 200,
      statusMessage: 'Successfully fetched service.',
      data: service,
    };
  } catch (error) {
    console.error('Error fetching service:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    });
  }
});
