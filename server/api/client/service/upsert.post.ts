import { getServerSession } from "#auth";
import { clientCode } from "../../../utils/logNames";
import { writeActivityLog } from "~~/server/utils/activityLog";

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
  const { data: body, missing } = normalisePayload(
    rawBody,
    CLIENT_SERVICE_FIELDS,
  );
  if (missing.length) {
    setResponseStatus(event, 400);
    return {
      error: `Missing or invalid: ${missing.join(", ")}`,
      fields: missing,
    };
  }

  if (!body?.clientId) {
    setResponseStatus(event, 400);
    return { error: "clientId is required" };
  }

  // The client is named by the request, so it decides which centre this record
  // lands in. A centre-bound user filing against someone else's client is
  // refused here rather than after the row is written.
  await assertClientScope(event, body.clientId);

  // ទម្រង់ទី២ may only be started once ទម្រង់ទី១ has been sent for approval.
  // Creating only — an existing record is never stranded by the order rule.
  await assertFormOrder(event, body.clientId, 2, !body?.id);

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

    await writeActivityLog(event, {
      action: body?.id ? "UPDATE" : "CREATE",
      entityType: "CLIENT_SERVICE",
      entityId: result.id,
      summary: `${body?.id ? "Updated" : "Created"} service record for client ${await clientCode(event.context.prisma, body.clientId)}`,
    });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id: result.id };
  } catch (e: any) {
    console.error("[client/service/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the service record" };
  }
});