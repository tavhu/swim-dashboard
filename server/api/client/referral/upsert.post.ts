import { REFERRAL_FIELDS } from "../../../utils/payload";

/**
 * Create or update one ការបញ្ជូន.
 *
 * No order gate. A referral is deliberately outside the ទម្រង់ទី១-៦ sequence:
 * it can be raised at any point in a case, and holding it behind a form the
 * client has not reached would block the thing it exists for.
 */
export default eventHandler(async (event) => {
  const rawBody = await readBody(event);
  const { data: body, missing } = normalisePayload(rawBody, REFERRAL_FIELDS);
  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(", ")}`, fields: missing };
  }

  if (!body?.clientId) {
    setResponseStatus(event, 400);
    return { error: "clientId is required" };
  }

  await assertClientScope(event, body.clientId);

  const data = {
    clientId: body.clientId,
    serviceTypeId: body.serviceTypeId || null,
    primaryReason: body.primaryReason || null,
    currentSituation: body.currentSituation || null,
    urgency: (["ROUTINE", "URGENT", "EMERGENCY"].includes(body.urgency) ? body.urgency : "ROUTINE") as any,
    consentObtained: body.consentObtained === true,
    attachments: body.attachments || null,
    signature: body.signature || null,
  };

  try {
    const row = body?.id
      ? await event.context.prisma.referral.update({ where: { id: body.id }, data, select: { id: true } })
      : await event.context.prisma.referral.create({ data, select: { id: true } });

    setResponseStatus(event, body?.id ? 200 : 201);
    return { message: "saved", id: row.id };
  } catch (e: any) {
    console.error("[client/referral/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the referral" };
  }
});
