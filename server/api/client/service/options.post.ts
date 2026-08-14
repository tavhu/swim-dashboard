import { getServerSession } from "#auth";

/**
 * The dropdown lists ទម្រង់ទី២ needs, in one request rather than five.
 *
 * Only active rows, and only the fields a `<select>` needs — id and names. The
 * rehabilitation levels come back whole because the form narrows them client
 * side as the user picks group then type, which avoids a round trip per step.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const prisma = event.context.prisma;

  try {
    const [clientTypes, services, rehabGroups, rehabTypes, rehabilitations] = await Promise.all([
      prisma.clientType.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true },
        orderBy: { nameKh: "asc" },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true },
        orderBy: { nameKh: "asc" },
      }),
      prisma.rehabGroup.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.rehabType.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true, groupId: true },
        orderBy: { code: "asc" },
      }),
      prisma.rehabilitation.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true, typeId: true },
        orderBy: { code: "asc" },
      }),
    ]);

    setResponseStatus(event, 200);
    return { clientTypes, services, rehabGroups, rehabTypes, rehabilitations };
  } catch (e: any) {
    console.error("[client/service/options]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not load the option lists" };
  }
});
