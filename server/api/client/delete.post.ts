import { getServerSession } from "#auth";
import fs from "fs/promises";
import path from "path";
import { resolveUploadPath } from "../../utils/uploads";
import { writeActivityLog } from "~~/server/utils/activityLog";

/**
 * Deletes a client and the whole case file hanging off it.
 *
 * This endpoint was written when ទម្រង់ទី១ was the only form. Every form built
 * since holds a `clientId` with ON DELETE RESTRICT, so a client with any
 * ទម្រង់ទី២-៦ record could not be deleted at all — the database refused and the
 * user saw a failure with no explanation.
 *
 * What has to go, and why it cannot be left to the database:
 *
 *   ទម្រង់ទី១ children   ClientProgress, ClientServeHistory, ServicesOnClients are
 *                       RESTRICT; ClientHopelessMultiple is SET NULL and would
 *                       be left orphaned.
 *   ទម្រង់ទី២-៦         all RESTRICT on clientId. Their own children
 *                       (CasePlanActivity, the two Reintegration lists,
 *                       FollowUpService) are ON DELETE CASCADE, so deleting the
 *                       parent row takes them.
 *   ApprovalEvent       recordId is a plain string, not a foreign key, so
 *                       nothing removes these automatically. Left behind they
 *                       are audit rows pointing at a client that no longer
 *                       exists.
 *   uploaded files      the photograph and every attachment across ទម្រង់ទី២, ៤
 *                       and ៥. The rows go, and without this the files stay on
 *                       disk forever — including a client's photograph, which is
 *                       exactly the personal data a delete is meant to remove.
 *
 * The database work is one transaction: a half-deleted case file is worse than
 * one that is still there. Files are removed after it commits, because a failed
 * unlink must not roll back a completed delete — an orphaned file is a tidiness
 * problem, a half-deleted client is a data-integrity one.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);
  const id: unknown = body?.id;

  if (typeof id !== "string" || id.length === 0) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  // Scoped before anything is read: deleting a whole case file is the least
  // reversible thing in the app, and it was open to any signed-in user with the
  // right, for any client in the country.
  await assertClientScope(event, id);

  const prisma = event.context.prisma;

  try {
    // Read the ids and file paths first: after the transaction they are gone.
    const client = await prisma.client_PersonalInformation.findUnique({
      where: { id },
      select: {
        id: true,
        photo: true,
        clientServices: { select: { id: true, attachments: true } },
        casePlans: { select: { id: true } },
        reintegrations: {
          select: {
            id: true,
            goalAttachments: true,
            communityAttachments: true,
          },
        },
        followUps: { select: { id: true, attachments: true } },
        caseClosures: { select: { id: true } },
      },
    });
    if (!client) {
      setResponseStatus(event, 404);
      return { error: "No client with that id" };
    }

    /** Every ApprovalEvent recordId belonging to this case file, the client included. */
    const recordIds = [
      client.id,
      ...client.clientServices.map((r) => r.id),
      ...client.casePlans.map((r) => r.id),
      ...client.reintegrations.map((r) => r.id),
      ...client.followUps.map((r) => r.id),
      ...client.caseClosures.map((r) => r.id),
    ];

    const paths = [
      client.photo,
      ...client.clientServices.map((r) => r.attachments),
      ...client.reintegrations.flatMap((r) => [
        r.goalAttachments,
        r.communityAttachments,
      ]),
      ...client.followUps.map((r) => r.attachments),
    ]
      .filter(Boolean)
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);

    const counts = {
      services: client.clientServices.length,
      casePlans: client.casePlans.length,
      reintegrations: client.reintegrations.length,
      followUps: client.followUps.length,
      closures: client.caseClosures.length,
      files: paths.length,
    };

    await prisma.$transaction([
      // ទម្រង់ទី២-៦ first: they hold the client, and their own children cascade.
      prisma.clientService.deleteMany({ where: { clientId: id } }),
      prisma.casePlan.deleteMany({ where: { clientId: id } }),
      prisma.reintegration.deleteMany({ where: { clientId: id } }),
      prisma.followUp.deleteMany({ where: { clientId: id } }),
      prisma.caseClosure.deleteMany({ where: { clientId: id } }),

      // ទម្រង់ទី១'s own children.
      prisma.clientProgress.deleteMany({
        where: { Client_PersonalInformationID: id },
      }),
      prisma.clientServeHistory.deleteMany({
        where: { Client_PersonalInformationID: id },
      }),
      prisma.servicesOnClients.deleteMany({ where: { clientId: id } }),
      prisma.clientHopelessMultiple.deleteMany({
        where: { client_PersonalInformationId: id },
      }),

      // The audit trail for every record above.
      prisma.approvalEvent.deleteMany({
        where: { recordId: { in: recordIds } },
      }),

      prisma.client_PersonalInformation.delete({ where: { id } }),
    ]);

    // Files last, and never fatally: resolveUploadPath refuses anything outside
    // public/uploads, so a malformed stored path cannot reach another directory.
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

    await writeActivityLog(event, {
      action: "DELETE",
      entityType: "CLIENT",
      entityId: id,
      summary: `Deleted client ${id}`,
    });

    setResponseStatus(event, 200);
    return {
      message: "delete success",
      id,
      deleted: { ...counts, filesRemoved },
    };
  } catch (e: any) {
    console.error("[client/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the client record" };
  }
});
