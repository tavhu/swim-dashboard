import { getServerSession } from "#auth";

/**
 * Deletes one follow-up record.
 *
 * ទម្រង់ទី៥ — តាមដាន និងវាយតម្លៃ. Its FollowUpService rows cascade and its
 * attachments go with it.
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
      delegate: event.context.prisma.followUp,
      recordType: "FOLLOW_UP",
      label: "follow-up",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/follow-up/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
