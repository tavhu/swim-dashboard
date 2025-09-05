import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    // Default values and parsing to integer
    const page = body?.page ? parseInt(body.page) : 1;
    const limit = body?.limit ? parseInt(body.limit) : 10;
    const sortBy = body?.sortBy || 'nameEN';
    const sortType = body?.sortType || 'asc';

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
