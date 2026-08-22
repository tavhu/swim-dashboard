import type { H3Event } from "h3";
import type {
  ActivityAction,
  ActivityEntityType,
  Prisma,
} from "@prisma/client";
import { getServerSession } from "#auth";

export type ActivityLogInput = {
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  serviceCenterID?: string | null;
  centreName?: string | null;
};

/**
 * Append one activity-log row. Safe to call from any write handler:
 * failures are logged to the console and never fail the main request.
 *
 * Usage (after a successful write):
 *
 *   await writeActivityLog(event, {
 *     action: "UPDATE",
 *     entityType: "CASE_PLAN",
 *     entityId: row.id,
 *     summary: `Updated case plan for client ${clientCode}`,
 *     metadata: { from: "DRAFT", to: "SUBMITTED" },
 *     serviceCenterID: centre?.id,
 *     centreName: centre?.nameKH,
 *   });
 */
export async function writeActivityLog(
  event: H3Event,
  input: ActivityLogInput,
): Promise<void> {
  try {
    const prisma = event.context.prisma;
    if (!prisma) return;

    let actorID: string | null = null;
    let actorName: string | null = null;
    let actorUsername: string | null = null;
    let userCentreId: string | null = null;

    try {
      const session = await getServerSession(event);
      // Same idea as server/utils/authorize.ts — id can be on `id` or `sub`
      const userId =
        session && typeof session === "object"
          ? String(
              (session as any).id ??
                (session as any).sub ??
                (session as any).user?.id ??
                "",
            ).trim() || null
          : null;

      if (userId) {
        const row = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            serviceCenterID: true,
          },
        });
        if (row) {
          actorID = row.id;
          actorUsername = row.username;
          actorName =
            [row.firstname, row.lastname].filter(Boolean).join(" ").trim() ||
            row.username;
          userCentreId = row.serviceCenterID;
        }
      }
    } catch {
      // no session — still write the log without actor
    }

    const req = event.node?.req;
    const forwarded = req?.headers?.["x-forwarded-for"];
    const ip =
      (typeof forwarded === "string"
        ? forwarded.split(",")[0]?.trim()
        : null) ||
      req?.socket?.remoteAddress ||
      null;
    const userAgent =
      (typeof req?.headers?.["user-agent"] === "string"
        ? req.headers["user-agent"]
        : null) || null;

    await prisma.activityLog.create({
      data: {
        actorID,
        actorName,
        actorUsername,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary ?? null,
        metadata: input.metadata ?? undefined,
        serviceCenterID: input.serviceCenterID ?? userCentreId,
        centreName: input.centreName ?? null,
        ip,
        userAgent,
      },
    });
  } catch (e) {
    console.error("[activityLog] failed to write:", e);
  }
}
