import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const searchQuery = query.q as string;

    const whereCondition: any = {
      isActive: true,
    };

    if (searchQuery) {
      whereCondition.OR = [
        { nameKh: { contains: searchQuery, mode: 'insensitive' } },
        { providingInstitution: { contains: searchQuery, mode: 'insensitive' } },
        { purpose: { contains: searchQuery, mode: 'insensitive' } },
        { legalBasis: { contains: searchQuery, mode: 'insensitive' } },
        { eligibleClients: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where: whereCondition,
      orderBy: {
        createdAt: 'desc',
      },
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
