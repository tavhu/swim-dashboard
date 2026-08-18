/**
 * The caller's own centre — id and name, nothing else.
 *
 * ទម្រង់ទី១ has a required មជ្ឈមណ្ឌល field, and the only way to fill it was
 * /api/center/get, which needs read on the centre-list resource. That is a
 * permission about browsing every centre in the country, and it was standing
 * between a data-entry officer and registering a client at the centre they work
 * at: no `center` read meant an empty dropdown and a form that could not be
 * saved. Granting them centre-list read to get past it would hand out far more
 * than the form needs.
 *
 * So this endpoint answers the narrower question. It takes no parameters — the
 * answer comes from the session, so there is nothing to scope and nothing a
 * caller can ask for that is not already theirs. Any signed-in user may call it;
 * a ministry-level user has no single centre and gets null.
 */
export default defineEventHandler(async (event) => {
  const caller = await getAuthUser(event);
  if (!caller) {
    setResponseStatus(event, 401);
    return { data: null };
  }

  if (!caller.serviceCenterID) {
    // Unscoped: this user picks from the full list instead.
    return { data: null };
  }

  const data = await event.context.prisma.serviceCenter.findUnique({
    where: { id: caller.serviceCenterID },
    select: { id: true, nameKH: true, nameEN: true },
  });

  return { data };
});
