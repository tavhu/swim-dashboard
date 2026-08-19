/**
 * Remove a referral service type — but only while nothing points at it.
 *
 * A type already named on a referral is deactivated instead. Deleting it would
 * either break those records or silently blank the field on a form someone
 * signed, and neither is a thing to do quietly.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const id: unknown = body?.id;

  if (typeof id !== "string" || !id) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const used = await event.context.prisma.referral.count({ where: { serviceTypeId: id } });
  if (used > 0) {
    await event.context.prisma.referralServiceType.update({ where: { id }, data: { isActive: false } });
    return { message: "deactivated", used };
  }

  await event.context.prisma.referralServiceType.delete({ where: { id } });
  return { message: "deleted" };
});
