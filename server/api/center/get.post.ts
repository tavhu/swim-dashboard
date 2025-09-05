import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { page = 1, limit = 10, sortBy = 'nameEN', sortType = 'asc' } = body;

    const skip = (page - 1) * limit;

    try {
        const [data, total] = await prisma.$transaction([
            prisma.serviceCenter.findMany({
                skip,
                take: limit,
                orderBy: {
                    [sortBy]: sortType,
                },
            }),
            prisma.serviceCenter.count(),
        ]);

        return { data, total };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch service centers' };
    }
});
