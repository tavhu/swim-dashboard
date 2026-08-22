import { readListQuery, searchFilter } from "../../utils/listQuery";

/**
 * CSV export of the activity log.
 *
 * Same permission and same filters as /list — the export is exactly what the
 * user is looking at on the page, not a different query. Rows are capped well
 * below the table's size because this is for hand-off (a ministry email), not
 * archival; the database backup covers that.
 *
 * UTF-8 BOM first: without it Excel opens Khmer text as mojibake.
 */

const SEARCHABLE = ["summary", "actorName", "actorUsername", "centreName"] as const;

const HEADERS = [
  "ពេលវេលា",
  "អ្នកប្រើប្រាស់",
  "ឈ្មោះគណនី",
  "សកម្មភាព",
  "ប្រភេទ",
  "លេខសម្គាល់",
  "សេចក្ដីសង្ខេប",
  "មណ្ឌល",
  "IP",
] as const;

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  // Quote anything with a quote, comma, newline — and prefix a leading = + - @
  // with ' so spreadsheet apps do not execute it as a formula (CSV injection).
  if (/^[=+\-@]/.test(s)) {
    return `"='${s.replace(/"/g, '""')}"`;
  }
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const prisma = event.context.prisma;

  const q = readListQuery(body, {
    sortable: ["createdAt"],
    searchable: SEARCHABLE,
    defaultSort: "createdAt",
    defaultSortType: "desc",
    defaultTake: 5000,
    maxTake: 5000,
  });

  // Same filter construction as /list. Kept inline rather than shared because
  // the two differ in take/skip semantics, but the where must match.
  const where: Record<string, any> = searchFilter(q.search, SEARCHABLE) ?? {};
  if (body?.action) where.action = String(body.action);
  if (body?.entityType) where.entityType = String(body.entityType);
  if (body?.actorID) where.actorID = String(body.actorID);
  if (body?.serviceCenterID) where.serviceCenterID = String(body.serviceCenterID);

  if (body?.actor && typeof body.actor === "string" && body.actor.trim()) {
    const term = body.actor.trim();
    where.AND = [
      ...(where.AND ?? []),
      {
        OR: [
          { actorName: { contains: term, mode: "insensitive" } },
          { actorUsername: { contains: term, mode: "insensitive" } },
        ],
      },
    ];
  }

  if (body?.dateFrom || body?.dateTo) {
    where.createdAt = {};
    if (body.dateFrom) {
      const from = new Date(body.dateFrom);
      if (!Number.isNaN(from.getTime())) {
        from.setHours(0, 0, 0, 0);
        where.createdAt.gte = from;
      }
    }
    if (body.dateTo) {
      const to = new Date(body.dateTo);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }
  }

  try {
    const rows = await prisma.activityLog.findMany({
      where,
      take: q.take,
      orderBy: { createdAt: "desc" },
    });

    const lines = [HEADERS.join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.createdAt ? new Date(r.createdAt).toISOString() : "",
          csvCell(r.actorName),
          csvCell(r.actorUsername),
          csvCell(r.action),
          csvCell(r.entityType),
          csvCell(r.entityId),
          csvCell(r.summary),
          csvCell(r.centreName),
          csvCell(r.ip),
        ].join(",")
      );
    }

    setResponseStatus(event, 200);
    setHeader(event, "Content-Type", "text/csv; charset=utf-8");
    setHeader(
      event,
      "Content-Disposition",
      `attachment; filename="activity-log-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    // \uFEFF is the BOM Excel needs to read the Khmer headers correctly.
    return "\uFEFF" + lines.join("\r\n");
  } catch (e: any) {
    console.error("[activity-log/export]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Export failed" };
  }
});
