import fs from "fs/promises";
import { resolveUploadPath } from "./uploads";
import { writeActivityLog } from "~~/server/utils/activityLog";

/**
 * Deleting one ទម្រង់ទី២-៦ record.
 *
 * The five forms differ only in which delegate holds the row and which columns
 * hold attachment paths, so the work is shared here the way the approval
 * transitions are shared in ./approval.ts — rather than five near-identical
 * endpoints that would drift apart.
 *
 * Two things the database will not do on its own:
 *
 *   ApprovalEvent   recordId is a plain string, not a foreign key. Nothing
 *                   removes these when the record goes, and left behind they are
 *                   audit rows pointing at a record that no longer exists.
 *   uploaded files  the attachments belonging to ទម្រង់ទី២, ៤ and ៥. The row
 *                   goes either way; without this the files stay on disk
 *                   forever.
 *
 * Each form's own children (CasePlanActivity, the two Reintegration lists,
 * FollowUpService) are ON DELETE CASCADE, so deleting the parent takes them.
 *
 * Row and audit rows go in one transaction. Files are unlinked after it commits,
 * because a failed unlink must not roll back a completed delete.
 */

export type FormRecordType =
  | "CLIENT_SERVICE"
  | "CASE_PLAN"
  | "REINTEGRATION"
  | "FOLLOW_UP"
  | "CASE_CLOSURE";

/** Columns holding comma-separated upload paths, per form. */
const ATTACHMENT_FIELDS: Record<FormRecordType, string[]> = {
  CLIENT_SERVICE: ["attachments"],
  CASE_PLAN: [],
  REINTEGRATION: ["goalAttachments", "communityAttachments"],
  FOLLOW_UP: ["attachments"],
  CASE_CLOSURE: [],
};

export async function runRecordDelete(opts: {
  event: any;
  delegate: any;
  recordType: FormRecordType;
  label: string;
  id: unknown;
}) {
  const { event, delegate, recordType, label, id } = opts;

  if (typeof id !== "string" || id.length === 0) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const prisma = event.context.prisma;
  const fields = ATTACHMENT_FIELDS[recordType];

  // Read the paths before the row goes — afterwards there is nothing to read.
  const select: Record<string, any> = {
    id: true,
    clientId: true,
    // Whose centre this record belongs to. ទម្រង់ទី២-៦ have no centre column of
    // their own, so it comes through the client.
    client: { select: { serviceCenterID: true } },
  };
  for (const f of fields) select[f] = true;

  const record = await delegate.findUnique({ where: { id }, select });
  if (!record) {
    setResponseStatus(event, 404);
    return { error: `No ${label} with that id` };
  }

  // Deleting is the one operation with no undo, so it is scoped like the rest —
  // here, in the shared helper, so no form's delete endpoint can be the one that
  // was forgotten.
  const caller = await getAuthUser(event);
  if (
    caller?.serviceCenterID &&
    caller.serviceCenterID !== record.client?.serviceCenterID
  ) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ") };
  }

  const paths: string[] = fields
    .map((f) => record[f])
    .filter(Boolean)
    .flatMap((v: any) => String(v).split(","))
    .map((s: string) => s.trim())
    .filter(Boolean);

  await prisma.$transaction([
    prisma.approvalEvent.deleteMany({ where: { recordType, recordId: id } }),
    delegate.delete({ where: { id } }),
  ]);

  // resolveUploadPath refuses anything outside public/uploads, so a malformed
  // stored path cannot reach another directory.
  let filesRemoved = 0;
  for (const rel of paths) {
    const abs = resolveUploadPath(rel);
    if (!abs) continue;
    try {
      await fs.unlink(abs);
      filesRemoved++;
    } catch {
      /* already gone, or never written */
    }
  }

  // The record is gone, but its client still exists — name the client by code,
  // not by the raw record id nobody can read.
  const { clientCode } = await import("./logNames");
  const clientLabel = await clientCode(prisma, record.clientId);

  await writeActivityLog(event, {
    action: "DELETE",
    entityType: recordType,
    entityId: id,
    summary: `Deleted ${label} for client ${clientLabel}`,
    serviceCenterID: record.client?.serviceCenterID ?? null,
  });

  setResponseStatus(event, 200);
  return {
    message: "delete success",
    id,
    clientId: record.clientId,
    deleted: { files: paths.length, filesRemoved },
  };
}
