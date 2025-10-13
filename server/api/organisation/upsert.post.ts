import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const organisation = await prisma.organisation.upsert({
      where: {
        id: body?.id || ''
      },
      create: {
        name: body.name,
        logo: body.logo,
        website: body.website,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
      },
      update: {
        name: body.name,
        logo: body.logo,
        website: body.website,
        email: body.email,
        phoneNumber: body.phoneNumber,
        address: body.address,
      },
    });
    return { organisation };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to upsert organisation' };
  }
});
