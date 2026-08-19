/** Delete one ការបញ្ជូន, with its audit rows and uploaded files. */
export default eventHandler(async (event) => {
  const body = await readBody(event);
  try {
    return await runRecordDelete({
      event,
      delegate: event.context.prisma.referral,
      recordType: "REFERRAL" as any,
      label: "referral",
      id: body?.id,
    });
  } catch (e: any) {
    console.error("[client/referral/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the record" };
  }
});
