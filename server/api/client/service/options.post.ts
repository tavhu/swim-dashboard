import { getServerSession } from "#auth";

/**
 * The dropdown lists ទម្រង់ទី២ needs, in one request rather than two.
 *
 * Only active rows, and only the fields a `<select>` needs — id and names.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const prisma = event.context.prisma;

  try {
    const [clientTypes, services] = await Promise.all([
      // nameEn comes back too so the dropdowns can follow the reader's language.
      // It is optional on both tables, and the UI falls back to Khmer.
      prisma.clientType.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true, nameEn: true },
        orderBy: { nameKh: "asc" },
      }),
      prisma.service.findMany({
        where: { isActive: true },
        select: { id: true, nameKh: true, nameEn: true },
        orderBy: { nameKh: "asc" },
      }),
    ]);

    setResponseStatus(event, 200);
    return { clientTypes, services };
  } catch (e: any) {
    console.error("[client/service/options]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not load the option lists" };
  }
});
