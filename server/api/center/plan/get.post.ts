import { getServerSession } from "#auth";
import { readListQuery, searchFilter, orderByFor } from "../../../utils/listQuery";

/**
 * This returned every plan the caller could see, with no paging, and the page
 * then searched, sorted and paginated in the browser. That is fine at three rows
 * and wrong at three thousand — the whole table crosses the wire on every load,
 * and it is the pattern the rest of the list endpoints were just moved off.
 */
const SORTABLE = ["yearPlan", "actvityPlan", "note", "ServiceCenter.nameKH"] as const;
const SEARCHABLE = ["yearPlan", "actvityPlan", "note", "ServiceCenter.nameKH"] as const;

export default eventHandler(async (event) => {

  const session = await getServerSession(event);
  if (!session) {
    console.error("[API Error] Session not found. User is unauthenticated.");
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);
  const resourceName = body.resource;

  if (!resourceName) {
    console.error("[API Error] Request is missing the 'resource' in the body.");
    setResponseStatus(event, 400);
    return { error: "Request is missing the 'resource' in the body." };
  }


  const sessionUser = session as any;

  // Step 1: Fetch the full user from the database using the session ID
  const dbUser = await event.context.prisma.user.findUnique({
    where: { id: sessionUser.id },
  });

  if (!dbUser) {
    console.error(
      `[API Error] User with ID '${sessionUser.id}' not found in database.`
    );
    setResponseStatus(event, 404);
    return { error: "Authenticated user not found in database." };
  }

  const frontEndURL = resourceName;

  try {
    const resource = await event.context.prisma.resources.findFirst({
      where: { frontEndURL: frontEndURL },
    });

    if (!resource) {
      console.error(
        `[API Error] Resource '${frontEndURL}' not found in the database.`
      );
      setResponseStatus(event, 404);
      return { error: `Resource '${frontEndURL}' not found.` };
    }

    const permission = await event.context.prisma.roleToResource.findFirst({
      where: {
        roleID: dbUser.userRoleID, // Using the roleID from the database user
        resourceID: resource.id,
      },
    });

    if (!permission || !permission.read) {
      console.error(
        `[API Error] Permission denied for roleID: ${dbUser.userRoleID} on resource '${frontEndURL}'. Permission record:`,
        permission
      );
      setResponseStatus(event, 403);
      return {
        error: `Forbidden. You do not have permission to view the resource '${frontEndURL}'.`,
      };
    }

    let whereClause = {};
    if (permission.granted === false && dbUser.serviceCenterID) {
      whereClause = { serviceCenterID: dbUser.serviceCenterID };
    } else {
    }

    const q = readListQuery(body, {
      sortable: SORTABLE,
      searchable: SEARCHABLE,
      defaultSort: "yearPlan",
      defaultSortType: "desc",
    });

    // The centre scope above and the search term both have to apply.
    const where = { ...whereClause, ...(searchFilter(q.search, SEARCHABLE) ?? {}) };

    const [plans, total] = await Promise.all([
      event.context.prisma.centerPlan.findMany({
        where,
        include: { ServiceCenter: true },
        orderBy: orderByFor(q.sortBy, q.sortType),
        take: q.take,
        skip: q.skip,
      }),
      event.context.prisma.centerPlan.count({ where }),
    ]);

    // `plans` is what this endpoint has always returned; `data`/`total` are what
    // the shared table expects.
    return { plans, data: plans, total };
  } catch (e) {
    console.error(
      "[API Critical Error] An unexpected error occurred in the try-catch block:",
      e
    );
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while fetching the plans.",
    };
  }
});
