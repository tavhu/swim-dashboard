import { getServerSession } from "#auth";
import { readListQuery, searchFilter, orderByFor } from "../../../utils/listQuery";

/**
 * Centre staff, of either kind.
 *
 * The two kinds are separate tables with different column names, so each has its
 * own sortable and searchable lists — sorting contract staff by `firstNameKH`
 * would be a Prisma error, not an empty page.
 *
 * The totals were also counted across the whole table while the rows were
 * filtered by centre, so a centre with three staff showed "of 57".
 */
const CONTRACT = {
  sortable: ["firstName", "lastName", "gender", "position", "serviceCenter.nameKH"] as const,
  searchable: [
    "firstName",
    "lastName",
    "fullnameEN",
    "position",
    "telephone",
    "serviceCenter.nameKH",
  ] as const,
  defaultSort: "firstName",
};

const OFFICIAL = {
  sortable: ["firstNameKH", "lastNameKH", "gender", "CurrentRank", "ServiceCenter.nameKH"] as const,
  searchable: [
    "firstNameKH",
    "lastNameKH",
    "firstNameEN",
    "lastNameEN",
    "telephone",
    "email",
    "CurrentRank",
    "ServiceCenter.nameKH",
  ] as const,
  defaultSort: "firstNameKH",
};

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session || !body?.typeEmployee) {
    return { status: "unauthenticated" };
  }

  const isContract = body.typeEmployee == "Contract";
  const cfg = isContract ? CONTRACT : OFFICIAL;
  const delegate = isContract
    ? event.context.prisma.staff
    : event.context.prisma.governStaff;

  try {
    const q = readListQuery(body, {
      sortable: cfg.sortable,
      searchable: cfg.searchable,
      defaultSort: cfg.defaultSort,
      defaultSortType: "asc",
    });

    // A user attached to a centre sees only that centre's staff; everyone else
    // sees every staff member who is attached to one.
    const centerId = (session as any)?.serviceCenterID;
    const where = {
      serviceCenterID: centerId ? centerId : { not: null },
      ...(searchFilter(q.search, cfg.searchable) ?? {}),
    };

    const select = isContract
      ? {
          id: true,
          firstName: true,
          lastName: true,
          gender: true,
          position: true,
          telephone: true,
          serviceCenterID: true,
          // Lowercase here: Staff names the relation `serviceCenter`, only
          // governStaff capitalises it. Selecting the wrong one is a Prisma
          // error, which is why this list threw before it was ever searchable.
          serviceCenter: { select: { id: true, nameKH: true } },
        }
      : {
          id: true,
          firstNameKH: true,
          lastNameKH: true,
          gender: true,
          telephone: true,
          CurrentRank: true,
          serviceCenterID: true,
          ServiceCenter: { select: { id: true, nameKH: true } },
        };

    const [data, totalCount] = await Promise.all([
      delegate.findMany({
        where,
        select,
        orderBy: orderByFor(q.sortBy, q.sortType),
        take: q.take,
        skip: q.skip,
      }),
      delegate.count({ where }),
    ]);

    setResponseStatus(event, 201);
    return { data, total: totalCount, error: "", status: "authenticated" };
  } catch (e: any) {
    console.error("[center/staff/get]", e);
    setResponseStatus(event, 412);
    return { data: [], total: 0, error: e?.message ?? "Could not load staff" };
  }
});
