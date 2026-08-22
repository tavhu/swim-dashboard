import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

/**
 * Activity log list. Gated on `activity-log` read.
 * Anyone with the grant sees the whole system (no centre scoping).
 */
const SORTABLE = ["createdAt", "action", "entityType", "actorName"] as const;
const SEARCHABLE = [
  "summary",
  "actorName",
  "actorUsername",
  "centreName",
] as const;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const prisma = event.context.prisma;

  const q = readListQuery(body, {
    sortable: SORTABLE,
    searchable: SEARCHABLE,
    defaultSort: "createdAt",
    defaultSortType: "desc",
    defaultTake: 50,
    maxTake: 200,
  });

  // Rows-per-page comes from the page's dropdown. readListQuery only knows
  // `limit` (the vue3-tailwind shape), so honour `take` too — clamped to the
  // same max so a hand-crafted body cannot pull the whole table at once.
  if (body?.take !== undefined) {
    const n = parseInt(String(body.take), 10);
    q.take = Number.isFinite(n) && n > 0 ? Math.min(n, 200) : q.take;
  }

  const where: Record<string, any> = searchFilter(q.search, SEARCHABLE) ?? {};

  if (body?.action) where.action = String(body.action);
  if (body?.entityType) where.entityType = String(body.entityType);
  if (body?.actorID) where.actorID = String(body.actorID);
  if (body?.serviceCenterID)
    where.serviceCenterID = String(body.serviceCenterID);

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
    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        skip: q.skip,
        take: q.take,
        orderBy: orderByFor(q.sortBy, q.sortType),
      }),
      prisma.activityLog.count({ where }),
    ]);
    return { data, total };
  } catch (e: any) {
    console.error("[activity-log/list]", e);
    setResponseStatus(event, 502);
    return {
      data: [],
      total: 0,
      error: e?.message ?? "Failed to load activity log",
    };
  }
});
