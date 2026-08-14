import { getServerSession } from "#auth";

/**
 * Approval transitions for ទម្រង់ទី២, and the audit row behind them.
 *
 * ApprovalEvent has existed since migration 38 with nothing writing to it. Every
 * transition is recorded there — who, when, from what to what, and why on a
 * rejection — because "who approved this client's service" is the sort of
 * question a case file has to answer later.
 *
 * Transitions are checked server-side. The panel hides the buttons it should,
 * but a hidden button is not a rule.
 */
const ALLOWED: Record<string, { from: string[]; to: string }> = {
  submit: { from: ["DRAFT", "REJECTED"], to: "SUBMITTED" },
  approve: { from: ["SUBMITTED"], to: "APPROVED" },
  reject: { from: ["SUBMITTED"], to: "REJECTED" },
};

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);
  const { id, action, reason } = body ?? {};

  const rule = ALLOWED[action as string];
  if (!id || !rule) {
    setResponseStatus(event, 400);
    return { error: "id and a valid action (submit, approve, reject) are required" };
  }
  if (action === "reject" && !String(reason ?? "").trim()) {
    setResponseStatus(event, 400);
    return { error: "A rejection needs a reason" };
  }

  const prisma = event.context.prisma;
  const actorID = (session as any)?.id ?? (session as any)?.sub;

  try {
    const current = await prisma.clientService.findUnique({
      where: { id },
      select: { id: true, approvalStatus: true },
    });
    if (!current) {
      setResponseStatus(event, 404);
      return { error: "No such service record" };
    }
    if (!rule.from.includes(current.approvalStatus)) {
      setResponseStatus(event, 409);
      return {
        error: `Cannot ${action} a record that is ${current.approvalStatus}`,
        status: current.approvalStatus,
      };
    }

    const now = new Date();
    const data: Record<string, any> =
      action === "submit"
        ? { approvalStatus: "SUBMITTED", submittedAt: now, submittedByID: actorID, rejectionReason: null }
        : {
            approvalStatus: rule.to,
            decidedAt: now,
            decidedByID: actorID,
            rejectionReason: action === "reject" ? String(reason).trim() : null,
          };

    // One transaction: the record and its audit row move together or not at all.
    const [updated] = await prisma.$transaction([
      prisma.clientService.update({ where: { id }, data, select: { id: true, approvalStatus: true } }),
      prisma.approvalEvent.create({
        data: {
          recordType: "CLIENT_SERVICE",
          recordId: id,
          fromStatus: current.approvalStatus,
          toStatus: rule.to as any,
          actorID,
          reason: action === "reject" ? String(reason).trim() : null,
        },
      }),
    ]);

    setResponseStatus(event, 200);
    return { message: "ok", status: updated.approvalStatus };
  } catch (e: any) {
    console.error("[client/service/approve]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not record the decision" };
  }
});
