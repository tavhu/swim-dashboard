/**
 * Write the អំពីយើង page.
 *
 * Write on the `about` resource, which the ministry grants — in practice to
 * Super Admin, but expressed as a grant rather than hard-coded so it can be
 * delegated without a code change.
 *
 * The id is fixed to the constant the model defaults to. Taking it from the body
 * would let a caller create a second About page that nothing reads.
 */
export default defineEventHandler(async (event) => {
  const caller = await getAuthUser(event);
  const body = await readBody(event);

  const title = String(body?.title ?? "").trim() || null;
  const content = String(body?.content ?? "").trim() || null;

  const data = { title, content, updatedByID: caller?.id ?? null };

  const row = await event.context.prisma.aboutPage.upsert({
    where: { id: "about" },
    update: data,
    create: { id: "about", ...data },
  });

  setResponseStatus(event, 200);
  return { message: "ok", data: row };
});
