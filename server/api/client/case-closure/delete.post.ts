import { getServerSession } from "#auth";

/**
 * Deletes one case closure record.
 *
 * ទម្រង់ទី៦ — បិទករណី. Closing never changed the client record, so removing a
 * closure leaves the client exactly as it was.
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
      delegate: event.context.prisma.caseClosure,
      recordType: "CASE_CLOSURE",
      label: "case closure",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/case-closure/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
