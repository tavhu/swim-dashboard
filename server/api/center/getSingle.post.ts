import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
    const { id } = await readBody(event);

    try {
        const serviceCenter = await prisma.serviceCenter.findUnique({
            where: {
                id: id as string,
            },
            include: {
                staff: true,
                governStaff: true,
                systemUser: true,
                CenterPlan: true,
            },
        });
        return serviceCenter;
    } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch service center data' };
    }
});
