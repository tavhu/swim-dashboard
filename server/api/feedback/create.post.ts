/**
 * Leave មតិយោបល់. Open to anyone signed in — that is the point of it.
 *
 * The author is taken from the session, never from the body: feedback signed
 * with someone else's name is worse than anonymous feedback, and a field the
 * caller controls is a field the caller can forge. Their name and centre are
 * copied in as text alongside the relation, so a message still says who raised
 * it and from where after the account is gone.
 */
export default defineEventHandler(async (event) => {
  const caller = await getAuthUser(event);
  if (!caller) {
    setResponseStatus(event, 401);
    return { error: "Unauthenticated" };
  }

  const body = await readBody(event);
  const message = String(body?.message ?? "").trim();

  if (!message) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "សូមសរសេរមតិយោបល់របស់អ្នក") };
  }
  // Long enough for a real account of a problem, bounded so one submission
  // cannot be used to fill the table.
  if (message.length > 5000) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "មតិយោបល់វែងជ្រុល") };
  }

  // AuthUser carries the username but not the person's name, so it is read here
  // rather than being taken off the session — falling back to the username
  // would quietly file every message under an account name instead of a person.
  const [author, centre] = await Promise.all([
    event.context.prisma.user.findUnique({
      where: { id: caller.id },
      select: { firstname: true, lastname: true },
    }),
    caller.serviceCenterID
      ? event.context.prisma.serviceCenter.findUnique({
          where: { id: caller.serviceCenterID },
          select: { nameKH: true },
        })
      : Promise.resolve(null),
  ]);

  await event.context.prisma.feedback.create({
    data: {
      message,
      userID: caller.id,
      authorName:
        [author?.firstname, author?.lastname].filter(Boolean).join(" ").trim() ||
        caller.username,
      serviceCenterID: caller.serviceCenterID,
      centreName: centre?.nameKH ?? null,
    },
  });

  setResponseStatus(event, 201);
  return { message: "ok" };
});
