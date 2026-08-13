import { getServerSession } from "#auth";

/**
 * Dual-purpose endpoint, kept compatible with `pages/register/index.vue`:
 *
 *   { username }  → null if the name is free, a small object if it is taken
 *   { id }        → that user's profile, to populate the edit form
 *
 * It previously did `findFirst` with no `select`, so it returned the **entire
 * User row including the bcrypt password hash** to any signed-in caller — a
 * hash-harvesting and user-enumeration endpoint. It now returns only the
 * fields the form actually reads.
 */
const PROFILE_FIELDS = {
  id: true,
  firstname: true,
  lastname: true,
  username: true,
  image: true,
  status: true,
  userRoleID: true,
  serviceCenterID: true,
  organisationID: true,
  accountType: true,
  // password deliberately omitted
} as const;

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  const body = await readBody(event);
  const username: unknown = body?.username;
  const id: unknown = body?.id;

  try {
    // --- availability check ------------------------------------------------
    if (typeof username === "string" && username.length > 0) {
      const match = await event.context.prisma.user.findFirst({
        where: { username },
        select: { id: true, username: true },
      });
      setResponseStatus(event, 200);
      return match; // null when the username is free
    }

    // --- profile lookup for the edit form -----------------------------------
    if (typeof id === "string" && id.length > 0) {
      const profile = await event.context.prisma.user.findUnique({
        where: { id },
        select: PROFILE_FIELDS,
      });
      setResponseStatus(event, 200);
      return profile;
    }

    throw createError({
      statusCode: 400,
      statusMessage: "username or id is required",
    });
  } catch (e: any) {
    if (e?.statusCode) throw e;
    console.error("[user/checkUsername]", e);
    throw createError({ statusCode: 500, statusMessage: "Lookup failed" });
  }
});
