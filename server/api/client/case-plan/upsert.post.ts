import { getServerSession } from "#auth";
import { writeActivityLog } from "~~/server/utils/activityLog";

/**
 * ទម្រង់ទី៣ — create or update a client's case plan, with its ក. សកម្មភាពសេវាកម្ម
 * rows.
 *
 * The activities are replaced rather than diffed. The form lets a user add,
 * remove and reorder rows freely, so what arrives is the plan as it now stands;
 * working out which rows moved would be more code and more ways to be wrong than
 * writing the list the user is looking at. Both halves go in one transaction, so
 * a plan is never left with one version of its activities and another of itself.
 *
 * Types are coerced first: the form initialises every field to '' and Prisma
 * rejects that for DateTime columns — the fault that once made ទម្រង់ទី១
 * unsaveable whenever an optional date was left blank.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  const { data: body, missing } = normalisePayload(rawBody, CASE_PLAN_FIELDS);
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

  // ទម្រង់ទី៣ may only be started once ទម្រង់ទី២ has been sent for approval.
  // Creating only — an existing record is never stranded by the order rule.
  await assertFormOrder(event, body.clientId, 3, !body?.id);

  const data = {
    clientId: body.clientId,
    providerName: body.providerName || null,
    socialWorkerName: body.socialWorkerName || null,
    socialWorkerPhone: body.socialWorkerPhone || null,
    referralReason: body.referralReason || null,
    challenges: body.challenges || null,
    situationAssessment: body.situationAssessment || null,
    monitorDate: body.monitorDate ?? null,
    monitorMethod: body.monitorMethod || null,
    monitorResult: body.monitorResult || null,
    nextMonitorDate: body.nextMonitorDate ?? null,
    conclusion: body.conclusion || null,
  };

  /**
   * A row with no service and no dates is an empty row the user added and never
   * filled — dropped rather than stored, so the printed plan does not carry
   * blank numbered lines. sortOrder comes from position, which is what the
   * manual's ១, ២, ៣ numbering means.
   */
  const activities = (
    Array.isArray(rawBody?.activities) ? rawBody.activities : []
  )
    .map((row: any) => {
      const { data: r } = normalisePayload(
        row ?? {},
        CASE_PLAN_ACTIVITY_FIELDS,
      );
      return {
        serviceId: r.serviceId || null,
        startDate: r.startDate ?? null,
        endDate: r.endDate ?? null,
      };
    })
    .filter((r: any) => r.serviceId || r.startDate || r.endDate)
    .map((r: any, i: number) => ({ ...r, sortOrder: i }));

  /** ខ. សេវាបញ្ចូនបន្ត — same rules as ក. above, kept as its own list. */
  const referralServices = (
    Array.isArray(rawBody?.referralServices) ? rawBody.referralServices : []
  )
    .map((row: any) => {
      const { data: r } = normalisePayload(
        row ?? {},
        CASE_PLAN_REFERRAL_FIELDS,
      );
      return {
        referralTypeId: r.referralTypeId || null,
        primaryReason: r.primaryReason || null,
        currentSituation: r.currentSituation || null,
        urgency: (["ROUTINE", "URGENT", "EMERGENCY"].includes(r.urgency)
          ? r.urgency
          : "ROUTINE") as any,
        startDate: r.startDate ?? null,
        endDate: r.endDate ?? null,
        consentObtained: r.consentObtained === true,
        attachments: r.attachments || null,
        signature: r.signature || null,
      };
    })
    // A row is real if any of its meaningful fields is filled.
    .filter(
      (r: any) =>
        r.referralTypeId ||
        r.primaryReason ||
        r.currentSituation ||
        r.attachments ||
        r.signature ||
        r.startDate ||
        r.endDate,
    )
    .map((r: any, i: number) => ({ ...r, sortOrder: i }));

  try {
    const prisma = event.context.prisma;

    const id = await prisma.$transaction(async (tx: any) => {
      if (body?.id) {
        await tx.casePlan.update({
          where: { id: body.id },
          data,
          select: { id: true },
        });
        await tx.casePlanActivity.deleteMany({
          where: { casePlanId: body.id },
        });
        if (activities.length) {
          await tx.casePlanActivity.createMany({
            data: activities.map((a: any) => ({ ...a, casePlanId: body.id })),
          });
        }
        await tx.casePlanReferralService.deleteMany({
          where: { casePlanId: body.id },
        });
        if (referralServices.length) {
          await tx.casePlanReferralService.createMany({
            data: referralServices.map((r: any) => ({
              ...r,
              casePlanId: body.id,
            })),
          });
        }
        return body.id;
      }

      const created = await tx.casePlan.create({
        data: {
          ...data,
          activities: { create: activities },
          referralServices: { create: referralServices },
        },
        select: { id: true },
      });
      return created.id;
    });
    await writeActivityLog(event, {
      action: body?.id ? "UPDATE" : "CREATE",
      entityType: "CASE_CLOSURE",
      entityId: id, // or `id`
      summary: `${body?.id ? "Updated" : "Created"} case closure for client ${body.clientId}`,
    });
    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id };
  } catch (e: any) {
    if (e?.code === "P2025") {
      setResponseStatus(event, 404);
      return { error: "រកមិនឃើញផែនការនេះទេ" };
    }
    console.error("[client/case-plan/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the case plan" };
  }
});
