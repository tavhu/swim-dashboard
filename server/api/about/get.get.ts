/**
 * The អំពីយើង page content. Readable by anyone signed in — it is the ministry
 * telling its own staff who they are, which is not privileged.
 *
 * Returns nulls rather than 404 when nothing has been written yet, so the page
 * can render its empty state instead of an error. A page nobody has filled in is
 * not a fault.
 */
export default defineEventHandler(async (event) => {
  const row = await event.context.prisma.aboutPage.findUnique({ where: { id: "about" } });
  return { data: row ?? { id: "about", title: null, content: null, updatedAt: null } };
});
