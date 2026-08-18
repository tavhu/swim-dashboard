import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី៦ — create or update a case closure.
 *
 * The ក/ខ choice is enforced here, not only hidden in the form: whichever
 * reason group the closure is not gets cleared on save. Otherwise switching the
 * outcome after filling one group in would leave a record saying both that the
 * reintegration succeeded and that the client absconded.
 *
 * No dates and no child tables, so no normalisePayload — there is nothing on
 * this form Prisma would reject a blank string for.
 */
const OUTCOMES = ["SUCCESSFUL", "UNSUCCESSFUL"] as const;

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  if (!body?.clientId) {
    setResponseStatus(event, 400);
    return { error: "clientId is required" };
  }

  // The client is named by the request, so it decides which centre this record
  // lands in. A centre-bound user filing against someone else's client is
  // refused here rather than after the row is written.
  await assertClientScope(event, body.clientId);

  // ទម្រង់ទី៦ may only be started once ទម្រង់ទី៥ has been sent for approval.
  // Creating only — an existing record is never stranded by the order rule.
  await assertFormOrder(event, body.clientId, 6, !body?.id);

  const outcome = OUTCOMES.includes(body.outcome) ? body.outcome : "SUCCESSFUL";
  const successful = outcome === "SUCCESSFUL";

  const text = (v: any) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  const successReason = successful ? text(body.successReason) : null;

  const data = {
    clientId: body.clientId,
    outcome,

    // ក — kept only on a successful closure.
    successReason,
    // The free-text box belongs to ផ្សេងទៀត; on any other reason it is stale.
    successReasonOther:
      successful && successReason === "ផ្សេងទៀត" ? text(body.successReasonOther) : null,

    // ខ — kept only on an unsuccessful one.
    failureReasons: successful
      ? null
      : Array.isArray(body?.failureReasons)
        ? body.failureReasons.filter(Boolean).join(",") || null
        : text(body.failureReasons),

    // ៤ is asked of every closure, whichever way it went.
    centreStrengths: text(body.centreStrengths),
    centreWeaknesses: text(body.centreWeaknesses),
    centreVulnerabilities: text(body.centreVulnerabilities),
    communityStrengths: text(body.communityStrengths),
    communityWeaknesses: text(body.communityWeaknesses),
    communityVulnerabilities: text(body.communityVulnerabilities),
    futurePlan: text(body.futurePlan),
  };

  try {
    const prisma = event.context.prisma;
    const result = body?.id
      ? await prisma.caseClosure.update({ where: { id: body.id }, data, select: { id: true } })
      : await prisma.caseClosure.create({ data, select: { id: true } });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id: result.id };
  } catch (e: any) {
    if (e?.code === "P2025") {
      setResponseStatus(event, 404);
      return { error: "រកមិនឃើញកំណត់ត្រានេះទេ" };
    }
    console.error("[client/case-closure/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the case closure" };
  }
});
