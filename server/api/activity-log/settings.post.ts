import { getAuthUser } from "../../utils/authorize";

/**
 * Update retention years. Super Admin only.
 * retentionYears = 0 means keep forever.
 */
export default defineEventHandler(async (event) => {
  const user = await getAuthUser(event);
  if (!user || user.roleName !== "Super Admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Only Super Admin may change activity log retention",
    });
  }

  const body = await readBody(event);
  let years = parseInt(String(body?.retentionYears ?? ""), 10);
  if (!Number.isFinite(years) || years < 0) years = 5;
  if (years > 50) years = 50;

  const row = await event.context.prisma.activityLogSettings.upsert({
    where: { id: "activity-log" },
    update: { retentionYears: years, updatedByID: user.id },
    create: { id: "activity-log", retentionYears: years, updatedByID: user.id },
  });

  return { message: "ok", data: row };
});
