import { getServerSession } from "#auth";

/**
 * Approval transitions for ទម្រង់ទី៤ — the manual's ៦. សិទ្ធិធ្វើសេចក្តីសន្និដ្ឋាន.
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
      delegate: event.context.prisma.reintegration,
      recordType: "REINTEGRATION",
      label: "reintegration record",
      id: body?.id,
      action: body?.action,
      reason: body?.reason,
      actorID: (session as any)?.id ?? (session as any)?.sub,
    });
  } catch (e: any) {
    console.error("[client/reintegration/approve]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not record the decision" };
  }
});
