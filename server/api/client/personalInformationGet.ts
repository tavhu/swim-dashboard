import { getServerSession } from "#auth";
import { getAuthUser, centerScopeFilter } from "../../utils/authorize";
import { readListQuery, searchFilter, orderByFor } from "../../utils/listQuery";

/**
 * Columns the client list may be sorted on. `sortBy` reaches Prisma's orderBy,
 * and Prisma throws on an unknown field, so it is checked against this rather
 * than passed through.
 */
const SORTABLE = [
  "ReadableCode",
  "fullNameKH",
  "Gender",
  "DOB",
  "InterViewDate",
  "approvalStatus",
  "status",
  "ServiceCenter.nameKH",
] as const;

/**
 * Text columns the search box looks through. Only strings: `contains` on the
 * Boolean `status` or on a DateTime is a Prisma error, not an empty result.
 */
const SEARCHABLE = [
  "ReadableCode",
  "fullNameKH",
  "nickName",
  "POB",
  "Occupation",
  "villageBA",
  "communeBA",
  "districtBA",
  "cityProBA",
  "ServiceCenter.nameKH",
] as const;

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    const data = body?.id
      ? await event.context.prisma.client_PersonalInformation.findFirst({
          where: {
            id: body?.id,
          },
          include: {
            // ទម្រង់ទី២ fills its provider fields from the centre the client was
            // registered under, rather than asking for them a second time.
            ServiceCenter: {
              select: {
                id: true, nameKH: true, directorName: true, phoneNumber: true,
                Address: true, City: true, District: true, Commute: true, Village: true,
              },
            },
            ClientProgress: {
              where: {
                Client_PersonalInformationID: body?.id,
              },
            },
            ClientServeHistory: {
              where: {
                Client_PersonalInformationID: body?.id,
              },
            },
            ClientHopelessMultiple: {
              where: {
                client_PersonalInformationId: body?.id,
              },
            },
          },
        })
      : null;

    // The list branch: server-side search, sort and paging, and a total that
    // counts the matches rather than the table.
    //
    // The centre scope was `where: { id: session.serviceCenterID }` — it
    // filtered the client's *own id* by the centre id, so a user attached to a
    // centre matched no client at all and saw an empty list. It belongs on
    // serviceCenterID, which is what centerScopeFilter returns.
    let list: any = null;
    let totalCount = 0;
    if (!body?.id) {
      const user = await getAuthUser(event);
      const q = readListQuery(body, {
        sortable: SORTABLE,
        searchable: SEARCHABLE,
        defaultSort: "ReadableCode",
        defaultSortType: "desc",
      });

      const where = {
        ...(user ? centerScopeFilter(user) : {}),
        ...(searchFilter(q.search, SEARCHABLE) ?? {}),
      };

      [list, totalCount] = await Promise.all([
        event.context.prisma.client_PersonalInformation.findMany({
          where,
          orderBy: orderByFor(q.sortBy, q.sortType),
          take: q.take,
          skip: q.skip,
          select: {
            id: true,
            ReadableCode: true,
            fullNameKH: true,
            nickName: true,
            photo: true,
            Gender: true,
            DOB: true,
            InterViewDate: true,
            approvalStatus: true,
            status: true,
            ServiceCenter: { select: { id: true, nameKH: true } },
          },
        }),
        event.context.prisma.client_PersonalInformation.count({ where }),
      ]);
    }
    // InterviewerID is a plain column rather than a relation, so the officer's
    // name needs its own lookup. Only the name is selected — /api/user/checkUsername
    // once returned whole User rows including the bcrypt hash (see SECURITY.md).
    if (body?.id && data && (data as any).InterviewerID) {
      const interviewer = await event.context.prisma.user.findUnique({
        where: { id: (data as any).InterviewerID },
        select: { firstname: true, lastname: true },
      });
      (data as any).interviewerName = interviewer
        ? [interviewer.firstname, interviewer.lastname].filter(Boolean).join(" ")
        : null;
    }

    setResponseStatus(event, 201);
    return body?.id
      ? data
      : { data: list, total: totalCount, error: "", status: "authenticated" };
  } catch (e: any) {
    // Was `return { error: e }` — a Prisma error serialises to `{}`, so the
    // client saw an empty object and could report nothing useful.
    console.error("[client/personalInformationGet]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not load clients" };
  }
});
