import { PrismaClient } from '@prisma/client';
import { writeActivityLog } from '../../utils/activityLog';

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const organisation = await prisma.organisation.findUnique({
      where: { id: body.id },
      select: { name: true },
    });

    await prisma.organisation.delete({
      where: {
        id: body.id,
      },
    });

    await writeActivityLog(event, {
      action: 'DELETE',
      entityType: 'ORGANISATION',
      entityId: body.id,
      summary: `Deleted organisation ${organisation?.name || body.id}`,
    });

    return { message: 'Organisation deleted successfully' };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to delete organisation' };
  }
});
