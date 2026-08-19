/**
 * ការបញ្ជូន — read referrals.
 *
 * `id` returns one with everything the view page needs resolved; `clientId`
 * returns that client's referrals, newest first; neither returns the whole list
 * unscoped — the centre filter reaches through the client, as it does for
 * ទម្រង់ទី២-៦.
 */
export default eventHandler(async (event) => {
  const body = await readBody(event);

  const include = {
    client: {
      select: {
        id: true,
        ReadableCode: true,
        fullNameKH: true,
        nickName: true,
        photo: true,
        Gender: true,
        DOB: true,
        FOCTel: true,
        MOCTel: true,
      },
    },
    serviceType: { select: { nameKh: true, nameEn: true } },
  };

  try {
    const centre = await clientCentreFilter(event);

    if (body?.id) {
      const data = await event.context.prisma.referral.findFirst({
        where: { id: body.id, ...centre },
        include,
      });
      setResponseStatus(event, 200);
      return await withApproverNames(event, data as any);
    }

    if (body?.clientId) {
      const data = await event.context.prisma.referral.findMany({
        where: { clientId: body.clientId, ...centre },
        include,
        orderBy: { createdAt: "desc" },
      });
      setResponseStatus(event, 200);
      return { data, total: data.length };
    }

    // No id and no clientId: every referral the caller may see. This is what the
    // menu entry opens, and the reason this form has a list of its own — a
    // referral is followed up across clients, not only from inside one file.
    const data = await event.context.prisma.referral.findMany({
      where: { ...centre },
      include,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    setResponseStatus(event, 200);
    return { data, total: data.length };
  } catch (e: any) {
    console.error("[client/referral/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the referral" };
  }
});
