import { getServerSession } from "#auth";
import { writeActivityLog } from "~~/server/utils/activityLog";

/**
 * ទម្រង់ទី៥ — create or update a follow-up visit.
 *
 * The manual's ជ្រើសរើស (២)ឬ(៣) is enforced here rather than only hidden in the
 * form: whichever section was not chosen is cleared on save. Otherwise switching
 * the radio after filling one section would leave both sets of answers stored,
 * and the printed form would carry a section the visit was not.
 */
const STAGES = ["IN_CENTRE", "POST_REINTEGRATION"] as const;

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  const { data: body, missing } = normalisePayload(rawBody, FOLLOW_UP_FIELDS);
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

  // ទម្រង់ទី៥ may only be started once ទម្រង់ទី៤ has been sent for approval.
  // Creating only — an existing record is never stranded by the order rule.
  await assertFormOrder(event, body.clientId, 5, !body?.id);

  const stage = STAGES.includes(body.stage) ? body.stage : "IN_CENTRE";
  const inCentre = stage === "IN_CENTRE";

  const data = {
    clientId: body.clientId,
    stage,

    monitorDate: body.monitorDate ?? null,
    monitorMethod: body.monitorMethod || null,
    nextMonitorDate: body.nextMonitorDate ?? null,
    attachments: body.attachments || null,

    // Section ៣ only. Cleared when the visit is an in-centre one, so a record
    // never carries answers from the section it is not.
    informants: inCentre
      ? null
      : Array.isArray(rawBody?.informants)
        ? rawBody.informants.filter(Boolean).join(",") || null
        : body.informants || null,
    monitorResult: inCentre ? null : body.monitorResult || null,

    conclusion: body.conclusion || null,
  };

  /** Section ២ only, and dropped entirely when the visit is section ៣. */
  const services = !inCentre
    ? []
    : (Array.isArray(rawBody?.services) ? rawBody.services : [])
        .map((row: any) => {
          const { data: r } = normalisePayload(
            row ?? {},
            FOLLOW_UP_SERVICE_FIELDS,
          );
          return {
            serviceId: r.serviceId || null,
            startDate: r.startDate ?? null,
            endDate: r.endDate ?? null,
            outcome: r.outcome || null,
          };
        })
        // A row with nothing filled in is one the user added and never used.
        .filter(
          (r: any) => r.serviceId || r.startDate || r.endDate || r.outcome,
        )
        .map((r: any, i: number) => ({ ...r, sortOrder: i }));

  try {
    const prisma = event.context.prisma;

    const id = await prisma.$transaction(async (tx: any) => {
      if (body?.id) {
        await tx.followUp.update({
          where: { id: body.id },
          data,
          select: { id: true },
        });
        // Replaced rather than diffed, as the other forms' lists are. Runs even
        // when `services` is empty, which is how switching to section ៣ clears
        // rows left from section ២.
        await tx.followUpService.deleteMany({ where: { followUpId: body.id } });
        if (services.length) {
          await tx.followUpService.createMany({
            data: services.map((r: any) => ({ ...r, followUpId: body.id })),
          });
        }
        return body.id;
      }

      const created = await tx.followUp.create({
        data: { ...data, services: { create: services } },
        select: { id: true },
      });
      return created.id;
    });

    await writeActivityLog(event, {
      action: body?.id ? "UPDATE" : "CREATE",
      entityType: "FOLLOW_UP",
      entityId: id, // or `id`
      summary: `${body?.id ? "Updated" : "Created"} follow-up for client ${body.clientId}`,
    });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id };
  } catch (e: any) {
    if (e?.code === "P2025") {
      setResponseStatus(event, 404);
      return { error: "រកមិនឃើញកំណត់ត្រានេះទេ" };
    }
    console.error("[client/follow-up/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the follow-up record" };
  }
});
