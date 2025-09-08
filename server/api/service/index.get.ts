import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit as string, 10) || 10;
    const offset = parseInt(query.offset as string, 10) || 0;
    const searchQuery = query.search as string;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortType = (query.sortType as 'asc' | 'desc') || 'desc';

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

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where: whereCondition,
        orderBy: {
          [sortBy]: sortType,
        },
        take: limit,
        skip: offset,
      }),
      prisma.service.count({ where: whereCondition }),
    ]);
    
    return {
      data: services,
      total,
    };
  } catch (error) {
    console.error('Error fetching services:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'An internal server error occurred.',
    });
  }
});
