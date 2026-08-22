import { getAuthUser } from "../../utils/authorize";

/**
 * Delete activity log rows older than the configured retention period.
 * Super Admin only. If retentionYears is 0, nothing is deleted.
 */
export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  if (!user || user.roleName !== "Super Admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Only Super Admin may purge activity logs",
    });
  }

  const prisma = event.context.prisma;
  const settings = await prisma.activityLogSettings.findUnique({
    where: { id: "activity-log" },
  });
  const years = settings?.retentionYears ?? 5;

  if (years <= 0) {
    return {
      message: "ok",
      deleted: 0,
      note: "Retention is set to keep forever",
    };
  }

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  const result = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return {
    message: "ok",
    deleted: result.count,
    cutoff: cutoff.toISOString(),
    retentionYears: years,
  };
});
