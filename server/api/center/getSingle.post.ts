/**
 * One service centre, with its staff, officials, accounts and plans.
 *
 * Two things were wrong here.
 *
 * `systemUser: true` returned whole User rows — every column, including the
 * bcrypt `password` hash — to anyone who could read a centre. That is the same
 * fault SECURITY.md records against /api/user/checkUsername: an include with no
 * select hands out whatever the table happens to hold, so adding a column to
 * User silently widens what this endpoint leaks. Named fields only now, and no
 * password among them.
 *
 * There was also no centre scope, so a user attached to one centre could read
 * any other centre — its staff list, its officials and its accounts — by
 * changing the id in the request. `getSingle` is what /center?id=… calls.
 *
 * It also built its own `new PrismaClient()` rather than using the one on the
 * event context, opening a second connection pool per reload.
 */
export default defineEventHandler(async (event) => {
  const { id } = await readBody(event);

  if (typeof id !== "string" || id.length === 0) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const caller = await getAuthUser(event);
  if (caller?.serviceCenterID && caller.serviceCenterID !== id) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ") };
  }

  try {
    const serviceCenter = await event.context.prisma.serviceCenter.findUnique({
      where: { id },
      include: {
        staff: true,
        governStaff: true,
        systemUser: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            username: true,
            image: true,
            status: true,
            userRoleID: true,
            accountType: true,
          },
        },
        CenterPlan: true,
      },
    });
    return serviceCenter;
  } catch (error) {
    console.error("[center/getSingle]", error);
    setResponseStatus(event, 502);
    return { error: "Failed to fetch service center data" };
  }
});
