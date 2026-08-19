/** ការបញ្ជូន's approval transition — the same shared helper the six ទម្រង់ use. */
export default eventHandler(async (event) => {
  const body = await readBody(event);
  const caller = await getAuthUser(event);

  try {
    return await runApprovalTransition({
      event,
      delegate: event.context.prisma.referral,
      recordType: "REFERRAL",
      label: "referral",
      id: body?.id,
      action: body?.action,
      reason: body?.reason,
      actorID: caller?.id,
    });
  } catch (e: any) {
    if (e?.statusCode) throw e;
    console.error("[client/referral/approve]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Request failed" };
  }
});
