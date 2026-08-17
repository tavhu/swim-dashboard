import type { H3Event } from "h3";

/**
 * The ៥. សិទ្ធិអនុម័ត transition, shared by every ទម្រង់.
 *
 * All six forms carry the same approval fields and the same rules — an officer
 * submits, a centre director approves or rejects — so the only thing that
 * differs between them is which table the row lives in and which
 * ApprovalRecordType the audit row is filed under. Both arrive as arguments
 * rather than being duplicated per form, the same reasoning as the one shared
 * ApprovalPanel on the client side.
 *
 * Transitions are checked here, not in the panel. The panel hides the buttons it
 * should, but a hidden button is not a rule.
 */
const ALLOWED: Record<string, { from: string[]; to: string }> = {
  submit: { from: ["DRAFT", "REJECTED"], to: "SUBMITTED" },
  approve: { from: ["SUBMITTED"], to: "APPROVED" },
  reject: { from: ["SUBMITTED"], to: "REJECTED" },
};

/** Prisma model delegates all expose the parts used here. */
interface ApprovableDelegate {
  findUnique(args: any): Promise<any>;
  update(args: any): any;
}

export async function runApprovalTransition(opts: {
  event: H3Event;
  /** e.g. prisma.casePlan */
  delegate: ApprovableDelegate;
  /** Which ApprovalRecordType the audit row is filed under. */
  recordType: string;
  /** Used in the not-found message, so it reads as the thing the user asked for. */
  label: string;
  id: unknown;
  action: unknown;
  reason?: unknown;
  actorID?: string;
}) {
  const { event, delegate, recordType, label, id, action, reason, actorID } = opts;

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

  const current = await delegate.findUnique({
    where: { id },
    select: { id: true, approvalStatus: true },
  });
  if (!current) {
    setResponseStatus(event, 404);
    return { error: `No such ${label}` };
  }
  if (!rule.from.includes(current.approvalStatus)) {
    setResponseStatus(event, 409);
    return {
      error: `Cannot ${action} a record that is ${current.approvalStatus}`,
      status: current.approvalStatus,
    };
  }

  const now = new Date();
  // Submitting clears any previous rejection reason: it belonged to the version
  // that was turned back, and leaving it would make a fresh submission look
  // rejected.
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
    delegate.update({ where: { id }, data, select: { id: true, approvalStatus: true } }),
    prisma.approvalEvent.create({
      data: {
        recordType: recordType as any,
        recordId: id as string,
        fromStatus: current.approvalStatus,
        toStatus: rule.to as any,
        actorID,
        reason: action === "reject" ? String(reason).trim() : null,
      },
    }),
  ]);

  setResponseStatus(event, 200);
  return { message: "ok", status: updated.approvalStatus };
}
