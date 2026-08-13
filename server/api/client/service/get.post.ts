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
      },
    },
    clientType: { select: { nameKh: true, nameEn: true } },
    previousCenter: { select: { nameKH: true, nameEN: true } },
    rehabGroup: { select: { nameKh: true, nameEn: true } },
    rehabType: { select: { nameKh: true, nameEn: true } },
    rehabilitation: { select: { nameKh: true, nameEn: true } },
    followUpRehabilitation: { select: { nameKh: true, nameEn: true } },
  };

  try {
    if (body?.id) {
      const data = await event.context.prisma.clientService.findUnique({
        where: { id: body.id },
        include,
      });
      setResponseStatus(event, 200);
      return data;
    }

    if (body?.clientId) {
      const data = await event.context.prisma.clientService.findMany({
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
    console.error("[client/service/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the service record" };
  }
});
