
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const {
        skip = 0,
        limit = 10,
        search = '',
        sortBy = 'name',
        sortType = 'asc'
    } = body;

    const where = search ? {
        OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { website: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phoneNumber: { contains: search, mode: 'insensitive' } },
        ],
    } : {};

    const [data, total] = await Promise.all([
        prisma.organisation.findMany({
            skip: Number(skip),
            take: Number(limit),
            where,
            orderBy: {
                [sortBy]: sortType,
            },
        }),
        prisma.organisation.count({ where }),
    ]);

    return {
      data,
      total,
    }
  } catch (e) {
    console.error(e);
    setResponseStatus(event, 500);
    return {
      error: 'An internal server error occurred.'
    };
  }
});
