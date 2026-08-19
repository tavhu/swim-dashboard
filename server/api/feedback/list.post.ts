import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

/**
 * The មតិយោបល់ list. Gated on the `feedback-list` grant, so the ministry decides
 * who reads it.
 *
 * Deliberately not centre-scoped, unlike the client data. Feedback is about the
 * system rather than about a client, and the whole point of granting the right
 * is to put the messages in front of whoever is meant to act on them — scoping
 * it would mean a centre's complaints could only be read by that centre, which
 * is the opposite of raising them.
 */
const SORTABLE = ["createdAt", "authorName", "centreName", "handled"] as const;
const SEARCHABLE = ["message", "authorName", "centreName"] as const;

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const prisma = event.context.prisma;

  const q = readListQuery(body, {
    sortable: SORTABLE,
    searchable: SEARCHABLE,
    defaultSort: "createdAt",
    defaultSortType: "desc",
  });

  const where = searchFilter(q.search, SEARCHABLE) ?? {};

  try {
    const [data, total, unhandled] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip: q.skip,
        take: q.take,
        orderBy: orderByFor(q.sortBy, q.sortType),
      }),
      prisma.feedback.count({ where }),
      prisma.feedback.count({ where: { handled: false } }),
    ]);
    return { data, total, unhandled };
  } catch (e: any) {
    console.error("[feedback/list]", e);
    setResponseStatus(event, 502);
    return { data: [], total: 0, error: e?.message ?? "Failed to load feedback" };
  }
});
