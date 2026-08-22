import { PrismaClient } from '@prisma/client';
import { writeActivityLog } from '../../utils/activityLog';

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

    const service = await prisma.service.findUnique({ where: { id: serviceId }, select: { nameEn: true, nameKh: true } });

    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    await writeActivityLog(event, {
      action: 'DELETE',
      entityType: 'SERVICE',
      entityId: serviceId,
      summary: `Deactivated service ${service?.nameEn || service?.nameKh || serviceId}`,
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
