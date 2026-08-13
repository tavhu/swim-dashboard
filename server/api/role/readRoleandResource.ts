import { getServerSession } from "#auth";

/**
 * Returns the **caller's own** role and permission grants. Used by the
 * permission store and the global route middleware.
 *
 * The user id previously came from the request body:
 *
 *   const userID = body?.userID
 *   prisma.user.findUnique({ where: { id: userID }, … })
 *
 * so any signed-in user could read anyone else's permissions by passing a
 * different id. It is now taken from the session and the body is ignored.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const userID = (session as any)?.id ?? (session as any)?.sub;

  if (!userID) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  try {
    const data = await event.context.prisma.user.findUnique({
      where: { id: userID },
      select: {
        Role: {
          select: {
            resource: {
              select: {
                granted: true,
                read: true,
                Resource: true,
              },
            },
          },
        },
      },
    });

    setResponseStatus(event, 200);
    return { data };
  } catch (e) {
    console.error("[role/readRoleandResource]", e);
    throw createError({ statusCode: 500, statusMessage: "Lookup failed" });
  }
});
