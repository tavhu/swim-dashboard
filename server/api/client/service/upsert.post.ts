import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី២ — create or update a client's service episode.
 *
 * One endpoint for both, keyed on whether an id arrives, because the form is the
 * same either way. Types are coerced first: the form initialises every field to
 * '' and Prisma rejects that for DateTime and Boolean columns — the same fault
 * that made form 1 unsaveable whenever an optional date was left blank.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  const { data: body, missing } = normalisePayload(rawBody, CLIENT_SERVICE_FIELDS);
  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(", ")}`, fields: missing };
  }

  if (!body?.clientId) {
    setResponseStatus(event, 400);
    return { error: "clientId is required" };
  }

  const data = {
    clientId: body.clientId,
    clientTypeId: body.clientTypeId || null,
    reason: body.reason || null,
    attachments: body.attachments || null,
    diagnosisApprovedBy: body.diagnosisApprovedBy || null,
    conclusion: body.conclusion || null,
    serviceDate: body.serviceDate ?? null,
    providerName: body.providerName || null,
    providerLocation: body.providerLocation || null,
    providerAgent: body.providerAgent || null,
    providerPhone: body.providerPhone || null,
    currentStatus: body.currentStatus || null,
    serviceId: body.serviceId || null,
    followUpServiceId: body.followUpServiceId || null,
  };

  try {
    const result = body?.id
      ? await event.context.prisma.clientService.update({
          where: { id: body.id },
          data,
          select: { id: true },
        })
      : await event.context.prisma.clientService.create({
          data,
          select: { id: true },
        });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id: result.id };
  } catch (e: any) {
    console.error("[client/service/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the service record" };
  }
});
