/**
 * Read activity-log retention settings.
 * Gated on `activity-log` read.
 */
export default defineEventHandler(async (event) => {
  const prisma = event.context.prisma;
  let row = await prisma.activityLogSettings.findUnique({
    where: { id: "activity-log" },
  });
  if (!row) {
    row = await prisma.activityLogSettings.create({
      data: { id: "activity-log", retentionYears: 5 },
    });
  }
  return { data: row };
});
