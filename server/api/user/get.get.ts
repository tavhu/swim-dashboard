import { getServerSession } from "#auth";
import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

/** Checked against, never passed through: Prisma throws on an unknown field. */
const SORTABLE = ["username", "firstname", "lastname", "status", "Role.name"] as const;
/** Text columns only — `contains` on the Boolean `status` is an error. */
const SEARCHABLE = ["username", "firstname", "lastname", "Role.name"] as const;

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  // const body =  await readBody(event)
  const body = getQuery(event);

  // console.log(body)

  if (!session) {
    return {
      status: "unauthenticated",
      data: [],
      total: 0,
      error: "Not signed in",
    };
  }
  try {
    const q = readListQuery(body, {
      sortable: SORTABLE,
      searchable: SEARCHABLE,
      defaultSort: "username",
      defaultSortType: "asc",
    });
    const where = searchFilter(q.search, SEARCHABLE) ?? {};

    const [data, totalCount] = await Promise.all([
      event.context.prisma.user.findMany({
      where,
      select: {
        username: true,
        id: true,
        firstname: true,
        lastname: true,
        image: true,
        status: true,
        userRoleID: true,
        Role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: orderByFor(q.sortBy, q.sortType),
      take: q.take,
      skip: q.skip,
      }),
      // Counts the matches, not the table: the footer said "of 40" while the
      // search showed three rows.
      event.context.prisma.user.count({ where }),
    ]);

    // console.log(data)
    setResponseStatus(event, 201);
    return {
      data: data,
      total: totalCount,
      error: "",
      status: "authenticated",
    };
  } catch (e: any) {
    setResponseStatus(event, 412);
    return {
      data: [],
      total: 0,
      error: e?.message ?? "Request failed",
      status: "authenticated",
    };
  }
});
