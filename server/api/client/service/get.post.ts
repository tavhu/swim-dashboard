import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី២ — read service episodes.
 *
 * `id` returns one episode with everything the view page needs resolved:
 * the client it belongs to, and the labels behind the taxonomy ids so the
 * reader does not have to look them up itself. `clientId` returns that
 * client's episodes, newest first.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  const include = {
    client: {
      // Never the whole client row — this only needs the header fields.
      select: {
        id: true,
        ReadableCode: true,
        fullNameKH: true,
        nickName: true,
        photo: true,
        FOCTel: true,
        MOCTel: true,
        // The manual's section ២ asks these three, and ទម្រង់ទី១ already holds
        // them. Returned so the printed form can carry the full question set
        // without storing a second copy that could disagree.
        UsedtoRehab: true,
        HowManyTimeHaveServed: true,
        ClientServeHistory: {
          select: { id: true, nameCenterorPrison: true, DateTimeServed: true },
          orderBy: { DateTimeServed: "desc" },
        },
      },
    },
    clientType: { select: { nameKh: true, nameEn: true } },
    service: { select: { nameKh: true } },
    followUpService: { select: { nameKh: true } },
  };

  try {
    // Centre scope. ទម្រង់ទី២-៦ carry no centre of their own — they inherit the
    // one on the client they belong to — so the filter reaches through the
    // relation. Without it, any id in the request body was readable by anyone.
    const centre = await clientCentreFilter(event);

    if (body?.id) {
      const data = await event.context.prisma.clientService.findFirst({
        where: { id: body.id, ...centre },
        include,
      });
      setResponseStatus(event, 200);
      // submittedByID/decidedByID are plain columns, so the names need a lookup.
      return await withApproverNames(event, data);
    }

    if (body?.clientId) {
      const data = await event.context.prisma.clientService.findMany({
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
    console.error("[client/service/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the service record" };
  }
});
