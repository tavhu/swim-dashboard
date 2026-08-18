import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

/**
 * The service-centre list.
 *
 * `sortBy` went straight into Prisma's `orderBy`, so any unknown column was a
 * 500 rather than a fallback; it is checked against SORTABLE now. The count was
 * also unfiltered, which only became visible once there was a search to filter
 * by.
 */
const SORTABLE = ["nameKH", "nameEN", "type", "directorName", "status", "createdAt"] as const;
const SEARCHABLE = [
  "nameKH",
  "nameEN",
  "type",
  "directorName",
  "phoneNumber",
  "email",
  "Address",
  "City",
] as const;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const prisma = event.context.prisma;

  const q = readListQuery(body, {
    sortable: SORTABLE,
    searchable: SEARCHABLE,
    defaultSort: "nameKH",
    defaultSortType: "asc",
  });

  // This endpoint was called with `page`, the newer tables send `skip`. Accept
  // either, so the caller can move without the list silently starting at row 0.
  const skip = body?.page ? (parseInt(String(body.page), 10) - 1) * q.take : q.skip;

  /**
   * A centre-bound user sees their own centre and no other.
   *
   * This endpoint is both the centre list page and the source of ទម្រង់ទី១'s
   * មជ្ឈមណ្ឌល dropdown, so leaving it unscoped meant an officer attached to one
   * centre was offered every centre in the country to file a client under —
   * and could pick the wrong one by accident, not just on purpose.
   *
   * `centerScopeFilter` keys on serviceCenterID, which is the column on the
   * *client* table. A ServiceCenter is identified by its own `id`, so the
   * filter here is on id.
   */
  const caller = await getAuthUser(event);
  const ownCentre = caller?.serviceCenterID ? { id: caller.serviceCenterID } : {};

  const where = { ...ownCentre, ...(searchFilter(q.search, SEARCHABLE) ?? {}) };

  try {
    const [data, total] = await Promise.all([
      prisma.serviceCenter.findMany({
        where,
        skip: Number.isFinite(skip) && skip > 0 ? skip : 0,
        take: q.take,
        orderBy: orderByFor(q.sortBy, q.sortType),
      }),
      prisma.serviceCenter.count({ where }),
    ]);

    return { data, total };
  } catch (e: any) {
    console.error("[center/get]", e);
    setResponseStatus(event, 502);
    return { data: [], total: 0, error: e?.message ?? "Failed to fetch service centers" };
  }
});
