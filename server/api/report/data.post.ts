import { getServerSession } from "#auth";

/**
 * Rows for the on-screen report preview.
 *
 * Columns and query both come from server/utils/reports.ts, the same definition
 * the Excel and Word exports use, so what is downloaded is what was previewed.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);
  const def = findReport(body?.type);
  if (!def) {
    setResponseStatus(event, 400);
    return { error: "Unknown report type" };
  }

  const filters: ReportFilters = {
    dateFrom: body?.dateFrom || null,
    dateTo: body?.dateTo || null,
    centreId: body?.centreId || null,
    provinceCode: body?.provinceCode || null,
  };

  try {
    const rows = await def.run(event.context.prisma, filters);
    setResponseStatus(event, 200);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      columns: def.columns,
      rows,
      total: rows.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error("[report/data]", def.key, e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "មិនអាចបង្កើតរបាយការណ៍បានទេ" };
  }
});
