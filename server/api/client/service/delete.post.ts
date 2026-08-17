import { getServerSession } from "#auth";

/**
 * Deletes one client service record.
 *
 * ទម្រង់ទី២ — ការប្រើសេវាកម្មរបស់អតិថិជន. Its attachments go with it.
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
      delegate: event.context.prisma.clientService,
      recordType: "CLIENT_SERVICE",
      label: "client service",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/service/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
