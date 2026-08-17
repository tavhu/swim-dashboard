import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី៤ — read reintegration records.
 *
 * `id` returns one with both of its service lists; `clientId` returns that
 * client's records, newest first.
 *
 * The client select carries the manual's whole section ១ and nothing else — no
 * centre and no interviewer, which belong to the record rather than the client
 * once it is created. Age is derived on the page, not stored.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  // Both lists are numbered ១, ២, ៣ … in the manual, so their order is part of
  // the record rather than whatever the database returns.
  const serviceRow = {
    orderBy: { sortOrder: "asc" as const },
    // Service has no English name yet — part of the wider bilingual gap.
    include: { service: { select: { code: true, nameKh: true } } },
  };

  const include = {
    client: {
      select: {
        id: true,
        ReadableCode: true,
        fullNameKH: true,
        Gender: true,
        DOB: true,
        FOCTel: true,
        MOCTel: true,
        // អាសយដ្ឋានគ្រួសារ — gazetteer codes, resolved to Khmer names on the page.
        cityProBA: true,
        districtBA: true,
        communeBA: true,
        villageBA: true,
      },
    },
    pastServices: serviceRow,
    communityServices: serviceRow,
  };

  try {
    if (body?.id) {
      const data = await event.context.prisma.reintegration.findUnique({
        where: { id: body.id },
        include,
      });
      setResponseStatus(event, 200);
      return data;
    }

    if (body?.clientId) {
      const data = await event.context.prisma.reintegration.findMany({
        where: { clientId: body.clientId },
        include,
        orderBy: { createdAt: "desc" },
      });
      setResponseStatus(event, 200);
      return { data, total: data.length };
    }

    setResponseStatus(event, 400);
    return { error: "id or clientId is required" };
  } catch (e: any) {
    console.error("[client/reintegration/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the reintegration record" };
  }
});
