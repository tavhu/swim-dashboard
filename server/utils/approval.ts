import type { H3Event } from "h3";
import { writeActivityLog } from "~~/server/utils/activityLog";
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
  const { event, delegate, recordType, label, id, action, reason, actorID } =
    opts;

  const rule = ALLOWED[action as string];
  if (!id || !rule) {
    setResponseStatus(event, 400);
    return {
      error: "id and a valid action (submit, approve, reject) are required",
    };
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

  // --- who may decide -------------------------------------------------------
  //
  // Submitting is part of doing the work: whoever fills a ទម្រង់ in may send it
  // for approval. Approving and rejecting are not — they need the `approval`
  // right, and they are limited to the caller's own centre, so a director signs
  // off their own centre's cases and nobody else's.
  //
  // Checked here rather than in the six endpoints, for the same reason the
  // transitions are: one rule, one place, no form left out by accident.
  if (action === "approve" || action === "reject") {
    const caller = await getAuthUser(event);
    if (!caller || !userCan(caller, "approval", "write")) {
      setResponseStatus(event, 403);
      return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិអនុម័តទេ") };
    }

    // ទម្រង់ទី១ is the client, so it holds the centre itself; ទម្រង់ទី២-៦ reach
    // it through theirs.
    const scoped =
      recordType === "CLIENT"
        ? await prisma.client_PersonalInformation.findUnique({
            where: { id: id as string },
            select: { serviceCenterID: true },
          })
        : await (delegate as any).findUnique({
            where: { id },
            select: { client: { select: { serviceCenterID: true } } },
          });

    const recordCentre =
      recordType === "CLIENT"
        ? scoped?.serviceCenterID
        : scoped?.client?.serviceCenterID;

    if (!isInCenterScope(caller.serviceCenterID, recordCentre)) {
      setResponseStatus(event, 403);
      return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ") };
    }
  }

  const now = new Date();
  // Submitting clears any previous rejection reason: it belonged to the version
  // that was turned back, and leaving it would make a fresh submission look
  // rejected.
  const data: Record<string, any> =
    action === "submit"
      ? {
          approvalStatus: "SUBMITTED",
          submittedAt: now,
          submittedByID: actorID,
          rejectionReason: null,
        }
      : {
          approvalStatus: rule.to,
          decidedAt: now,
          decidedByID: actorID,
          rejectionReason: action === "reject" ? String(reason).trim() : null,
        };

  // One transaction: the record and its audit row move together or not at all.
  const [updated] = await prisma.$transaction([
    delegate.update({
      where: { id },
      data,
      select: { id: true, approvalStatus: true },
    }),
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

  const actionMap: Record<string, "SUBMIT" | "APPROVE" | "REJECT"> = {
    submit: "SUBMIT",
    approve: "APPROVE",
    reject: "REJECT",
  };
  const entityMap: Record<
    string,
    | "CLIENT"
    | "CLIENT_SERVICE"
    | "CASE_PLAN"
    | "REINTEGRATION"
    | "FOLLOW_UP"
    | "CASE_CLOSURE"
  > = {
    CLIENT: "CLIENT",
    CLIENT_SERVICE: "CLIENT_SERVICE",
    CASE_PLAN: "CASE_PLAN",
    REINTEGRATION: "REINTEGRATION",
    FOLLOW_UP: "FOLLOW_UP",
    CASE_CLOSURE: "CASE_CLOSURE",
  };

  const logAction = actionMap[action as string];
  const logEntity = entityMap[recordType];
  if (logAction && logEntity) {
    await writeActivityLog(event, {
      action: logAction,
      entityType: logEntity,
      entityId: id as string,
      summary: `${logAction} ${label} (${current.approvalStatus} → ${rule.to})`,
      metadata: {
        from: current.approvalStatus,
        to: rule.to,
        reason: action === "reject" ? String(reason ?? "").trim() : null,
      },
    });
  }

  setResponseStatus(event, 200);
  return { message: "ok", status: updated.approvalStatus };
}
