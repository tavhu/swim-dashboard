/** One ប្រភេទអតិថិជន, for the edit form. */
export default eventHandler(async (event) => {
  const prisma = event.context.prisma;
  const id = event.context.params?.id;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "សូមបញ្ជាក់ប្រភេទអតិថិជន" });
  }

  try {
    const row = await prisma.clientType.findUnique({ where: { id } });
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: "រកមិនឃើញប្រភេទអតិថិជននេះទេ" });
    }
    return { statusCode: 200, data: row };
  } catch (e: any) {
    // Without this the 404 above would be swallowed and reported as a 500.
    if (e?.statusCode) throw e;
    console.error("[client-type/get]", e);
    throw createError({ statusCode: 500, statusMessage: "មិនអាចទាញយកព័ត៌មានបានទេ" });
  }
});
