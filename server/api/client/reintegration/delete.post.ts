import { getServerSession } from "#auth";

/**
 * Deletes one reintegration record.
 *
 * ទម្រង់ទី៤ — សមាហរណកម្ម. Its two lists cascade; both attachment
 * columns are cleaned up.
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
      delegate: event.context.prisma.reintegration,
      recordType: "REINTEGRATION",
      label: "reintegration",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/reintegration/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
