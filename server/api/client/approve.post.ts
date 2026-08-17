import { getServerSession } from "#auth";

/**
 * Approval transitions for ទម្រង់ទី១.
 *
 * Client_PersonalInformation has carried approvalStatus, submittedAt/By,
 * decidedAt/By and rejectionReason since the approval migration, and
 * ApprovalRecordType.CLIENT has existed alongside them — but nothing ever wrote
 * to any of it. ទម្រង់ទី២-៦ could each be submitted and approved while the intake
 * form they all hang off could not, so a case file's first form was the one part
 * of it with no signature.
 *
 * Rules and audit row shared with the other ទម្រង់ via server/utils/approval.ts.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  try {
    return await runApprovalTransition({
      event,
      delegate: event.context.prisma.client_PersonalInformation,
      recordType: "CLIENT",
      label: "client record",
      id: body?.id,
      action: body?.action,
      reason: body?.reason,
      actorID: (session as any)?.id ?? (session as any)?.sub,
    });
  } catch (e: any) {
    console.error("[client/approve]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not record the decision" };
  }
});
