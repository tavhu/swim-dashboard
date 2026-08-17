import { getServerSession } from "#auth";

/**
 * Approval transitions for ទម្រង់ទី៦ — the manual's ៥. សិទ្ធិធ្វើសេចក្តីសន្និដ្ឋាន.
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
      delegate: event.context.prisma.caseClosure,
      recordType: "CASE_CLOSURE",
      label: "case closure",
      id: body?.id,
      action: body?.action,
      reason: body?.reason,
      actorID: (session as any)?.id ?? (session as any)?.sub,
    });
  } catch (e: any) {
    console.error("[client/case-closure/approve]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not record the decision" };
  }
});
