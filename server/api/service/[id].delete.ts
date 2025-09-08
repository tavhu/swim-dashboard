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

    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    return {
      statusCode: 200,
      statusMessage: 'Service deleted successfully.',
    };
  } catch (error) {
    console.error('Error deleting service:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    });
  }
});
