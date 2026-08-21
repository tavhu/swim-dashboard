/**
 * Write the អំពីយើង page (both languages).
 * Write permission is required on the `about` resource.
 */
export default defineEventHandler(async (event) => {
  const caller = await getAuthUser(event);
  const body = await readBody(event);

  const titleKh = String(body?.titleKh ?? "").trim() || null;
  const titleEn = String(body?.titleEn ?? "").trim() || null;
  const contentKh = String(body?.contentKh ?? "").trim() || null;
  const contentEn = String(body?.contentEn ?? "").trim() || null;

  const data = {
    titleKh,
    titleEn,
    contentKh,
    contentEn,
    updatedByID: caller?.id ?? null,
  };

  const row = await event.context.prisma.aboutPage.upsert({
    where: { id: "about" },
    update: data,
    create: { id: "about", ...data },
  });

  setResponseStatus(event, 200);
  return { message: "ok", data: row };
});
