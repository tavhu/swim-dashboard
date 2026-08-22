/**
 * Remove a referral service type — but only while nothing points at it.
 *
 * A type already named on a referral is deactivated instead. Deleting it would
 * either break those records or silently blank the field on a form someone
 * signed, and neither is a thing to do quietly.
 */
import { writeActivityLog } from "../../utils/activityLog";

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
    await writeActivityLog(event, {
      action: "DELETE",
      entityType: "REFERRAL_TYPE",
      entityId: id,
      summary: "Deactivated referral service type (still in use by referrals)",
      metadata: { used },
    });
    return { message: "deactivated", used };
  }

  await event.context.prisma.referralServiceType.delete({ where: { id } });
  await writeActivityLog(event, {
    action: "DELETE",
    entityType: "REFERRAL_TYPE",
    entityId: id,
    summary: "Deleted referral service type",
  });
  return { message: "deleted" };
});
