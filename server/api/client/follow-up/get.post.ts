import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី៥ — read follow-up visits.
 *
 * `id` returns one with its service rows; `clientId` returns that client's
 * visits, newest first.
 *
 * Section ១ comes from the client relation and is not stored on the record.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

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
    services: {
      // Numbered ១, ២, ៣ … in the manual, so the order is part of the record.
      orderBy: { sortOrder: "asc" as const },
      // Service has no English name yet — part of the wider bilingual gap.
      include: { service: { select: { code: true, nameKh: true } } },
    },
  };

  try {
    // Centre scope. ទម្រង់ទី២-៦ carry no centre of their own — they inherit the
    // one on the client they belong to — so the filter reaches through the
    // relation. Without it, any id in the request body was readable by anyone.
    const centre = await clientCentreFilter(event);

    if (body?.id) {
      const data = await event.context.prisma.followUp.findFirst({
        where: { id: body.id, ...centre },
        include,
      });
      setResponseStatus(event, 200);
      // submittedByID/decidedByID are plain columns, so the names need a lookup.
      return await withApproverNames(event, data);
    }

    if (body?.clientId) {
      const data = await event.context.prisma.followUp.findMany({
        where: { clientId: body.clientId, ...centre },
        include,
        orderBy: { createdAt: "desc" },
      });
      setResponseStatus(event, 200);
      return { data, total: data.length };
    }

    setResponseStatus(event, 400);
    return { error: "id or clientId is required" };
  } catch (e: any) {
    console.error("[client/follow-up/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the follow-up record" };
  }
});
