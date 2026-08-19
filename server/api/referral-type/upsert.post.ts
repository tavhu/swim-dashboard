/** Create or rename one referral service type. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const nameKh = String(body?.nameKh ?? "").trim();

  if (!nameKh) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "សូមបញ្ចូលឈ្មោះ") };
  }

  const data = {
    nameKh,
    nameEn: String(body?.nameEn ?? "").trim() || null,
    description: String(body?.description ?? "").trim() || null,
    isActive: body?.isActive !== false,
  };

  const row = body?.id
    ? await event.context.prisma.referralServiceType.update({ where: { id: body.id }, data })
    : await event.context.prisma.referralServiceType.create({ data });

  setResponseStatus(event, body?.id ? 200 : 201);
  return { message: "ok", data: row };
});
