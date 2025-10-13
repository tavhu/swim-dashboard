import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    const organisations = await prisma.organisation.findMany();
    return organisations;
  } catch (error) {
    console.error(error);
    return { error: 'Failed to fetch organisations' };
  }
});
