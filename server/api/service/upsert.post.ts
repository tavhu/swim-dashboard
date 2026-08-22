import { PrismaClient } from '@prisma/client';
import { writeActivityLog } from '../../utils/activityLog';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { id, ...data } = body;

    // Basic validation
    if (!data.nameKh) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service Name (nameKh) is required.',
      });
    }

    let service;
    let message;

    if (id) {
      // Update existing service
      service = await prisma.service.update({
        where: { id },
        data,
      });
      message = 'Service updated successfully.';
    } else {
      // Create new service
      service = await prisma.service.create({
        data,
      });
      message = 'Service created successfully.';
    }

    await writeActivityLog(event, {
      action: id ? 'UPDATE' : 'CREATE',
      entityType: 'SERVICE',
      entityId: service.id,
      summary: `${id ? 'Updated' : 'Created'} service ${data.nameEn || data.nameKh}`,
    });

    return {
      statusCode: 200,
      statusMessage: message,
      data: service,
    };
  } catch (error) {
    console.error('Error upserting service:', error);
    // Check if it's a known error type, otherwise throw a generic server error
    if (error.statusCode) {
        throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    });
  }
});
