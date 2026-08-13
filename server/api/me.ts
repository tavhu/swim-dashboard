/**
 * DISABLED.
 *
 * This endpoint used to create a user with username "admin" and the hardcoded
 * password "admin123" on every call, for any caller with a session:
 *
 *   await prisma.user.create({
 *     data: { username: "admin", password: await hash("admin123", 12), … }
 *   });
 *
 * If the real admin account were ever deleted, anyone signed in could POST
 * here and take over the system. It was one-off bootstrap code — accounts are
 * created through `/api/user/upsert`.
 *
 * Safe to delete this file outright.
 */
export default eventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: "This endpoint has been removed",
  });
});
