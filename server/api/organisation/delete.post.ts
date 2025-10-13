import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    await prisma.organisation.delete({
      where: {
        id: body.id,
      },
    });
    return { message: 'Organisation deleted successfully' };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete organisation' };
  }
});
