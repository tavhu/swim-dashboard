import { getServerSession } from "#auth";

/**
 * Deletes one case plan record.
 *
 * ទម្រង់ទី៣ — ផែនការករណី. Its CasePlanActivity rows cascade.
 *
 * The row, its ApprovalEvent audit trail and its uploaded files are handled by
 * the shared helper in server/utils/recordDelete.ts, as the approval
 * transitions are by server/utils/approval.ts.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  try {
    return await runRecordDelete({
      event,
      delegate: event.context.prisma.casePlan,
      recordType: "CASE_PLAN",
      label: "case plan",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/case-plan/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
