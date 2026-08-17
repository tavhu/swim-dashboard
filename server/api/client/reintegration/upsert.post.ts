import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី៤ — create or update a reintegration record with its two service
 * lists.
 *
 * Both lists are replaced rather than diffed, for the same reason ទម្រង់ទី៣'s
 * activities are: the form lets a user add, remove and reorder freely, so what
 * arrives is the record as it now stands. Everything goes in one transaction,
 * so the record is never left holding one version of itself and another of its
 * lists.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  const { data: body, missing } = normalisePayload(rawBody, REINTEGRATION_FIELDS);
  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(", ")}`, fields: missing };
  }

  if (!body?.clientId) {
    setResponseStatus(event, 400);
    return { error: "clientId is required" };
  }

  /** Ages come off a number input, which yields '' when cleared. */
  const age = (v: any) => {
    const n = Number(String(v ?? "").trim());
    return Number.isFinite(n) && n > 0 && n < 150 ? Math.trunc(n) : null;
  };

  const data = {
    clientId: body.clientId,

    consultation: body.consultation || null,

    handoverDate: body.handoverDate ?? null,
    recipient: body.recipient || null,
    recipientPhone1: body.recipientPhone1 || null,
    recipientPhone2: body.recipientPhone2 || null,

    communeChiefName: body.communeChiefName || null,
    communeChiefSex: body.communeChiefSex || null,
    communeChiefAge: age(body.communeChiefAge),
    communeChiefPhone: body.communeChiefPhone || null,
    villageChiefName: body.villageChiefName || null,
    villageChiefSex: body.villageChiefSex || null,
    villageChiefAge: age(body.villageChiefAge),
    villageChiefPhone: body.villageChiefPhone || null,
    localOrganisation: body.localOrganisation || null,

    goalAttachments: body.goalAttachments || null,
    communityAttachments: body.communityAttachments || null,

    monitorDate: body.monitorDate ?? null,
    // ជ្រើសរើសបានច្រើន — stored comma separated, as the schema notes.
    informants: Array.isArray(rawBody?.informants)
      ? rawBody.informants.filter(Boolean).join(",") || null
      : body.informants || null,
    monitorMethod: body.monitorMethod || null,
    monitorResult: body.monitorResult || null,
    nextMonitorDate: body.nextMonitorDate ?? null,

    conclusion: body.conclusion || null,
  };

  /**
   * A row with nothing filled in is one the user added and never used — dropped
   * rather than stored, so the printed record carries no blank numbered lines.
   * sortOrder comes from position, which is what the manual's ១, ២, ៣ means.
   */
  const rows = (input: any, withOutcome: boolean) =>
    (Array.isArray(input) ? input : [])
      .map((row: any) => {
        const { data: r } = normalisePayload(row ?? {}, REINTEGRATION_SERVICE_FIELDS);
        const base: any = {
          serviceId: r.serviceId || null,
          startDate: r.startDate ?? null,
          endDate: r.endDate ?? null,
        };
        if (withOutcome) base.outcome = r.outcome || null;
        return base;
      })
      .filter((r: any) => r.serviceId || r.startDate || r.endDate || r.outcome)
      .map((r: any, i: number) => ({ ...r, sortOrder: i }));

  const pastServices = rows(rawBody?.pastServices, true);
  const communityServices = rows(rawBody?.communityServices, false);

  try {
    const prisma = event.context.prisma;

    const id = await prisma.$transaction(async (tx: any) => {
      if (body?.id) {
        await tx.reintegration.update({ where: { id: body.id }, data, select: { id: true } });

        await tx.reintegrationPastService.deleteMany({ where: { reintegrationId: body.id } });
        if (pastServices.length) {
          await tx.reintegrationPastService.createMany({
            data: pastServices.map((r: any) => ({ ...r, reintegrationId: body.id })),
          });
        }

        await tx.reintegrationCommunityService.deleteMany({ where: { reintegrationId: body.id } });
        if (communityServices.length) {
          await tx.reintegrationCommunityService.createMany({
            data: communityServices.map((r: any) => ({ ...r, reintegrationId: body.id })),
          });
        }

        return body.id;
      }

      const created = await tx.reintegration.create({
        data: {
          ...data,
          pastServices: { create: pastServices },
          communityServices: { create: communityServices },
        },
        select: { id: true },
      });
      return created.id;
    });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id };
  } catch (e: any) {
    if (e?.code === "P2025") {
      setResponseStatus(event, 404);
      return { error: "រកមិនឃើញកំណត់ត្រានេះទេ" };
    }
    console.error("[client/reintegration/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the reintegration record" };
  }
});
