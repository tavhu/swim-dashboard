import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);

    // Basic validation
    if (!body.nameKh) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service Name (nameKh) is required.',
      });
    }

    const service = await prisma.service.create({
      data: {
        nameKh: body.nameKh,
        providingInstitution: body.providingInstitution,
        purpose: body.purpose,
        legalBasis: body.legalBasis,
        eligibleClients: body.eligibleClients,
        serviceStandard: body.serviceStandard,
        requiredDocuments: body.requiredDocuments,
        feedback: body.feedback,
      },
    });

    return {
      statusCode: 200,
      statusMessage: 'Service created successfully.',
      data: service,
    };
  } catch (error) {
    console.error('Error creating service:', error);
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
