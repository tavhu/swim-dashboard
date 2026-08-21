/**
 * The អំពីយើង page content. Readable by anyone signed in.
 * Returns nulls rather than 404 when nothing has been written yet.
 */
export default defineEventHandler(async (event) => {
  const row = await event.context.prisma.aboutPage.findUnique({
    where: { id: "about" },
  });

  return {
    data: row ?? {
      id: "about",
      titleKh: null,
      titleEn: null,
      contentKh: null,
      contentEn: null,
      updatedAt: null,
    },
  };
});
