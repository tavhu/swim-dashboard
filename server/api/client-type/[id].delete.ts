/**
 * Retire a ប្រភេទអតិថិជន.
 *
 * Soft delete, as services are. ClientService.clientTypeId points here, so a
 * hard delete would either be refused by the foreign key or, worse, take the
 * category off ទម្រង់ទី២ records that were filed under it. Flipping isActive
 * removes it from the dropdown and the settings list while leaving every
 * existing record readable.
 */
export default eventHandler(async (event) => {
  const prisma = event.context.prisma;
  const id = event.context.params?.id;

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "សូមបញ្ជាក់ប្រភេទអតិថិជន" });
  }

  try {
    const inUse = await prisma.clientService.count({ where: { clientTypeId: id } });

    await prisma.clientType.update({ where: { id }, data: { isActive: false } });

    return {
      statusCode: 200,
      // Reported so the screen can say the category is still on N records
      // rather than implying the data went with it.
      inUse,
    };
  } catch (e: any) {
    if (e?.code === "P2025") {
      throw createError({ statusCode: 404, statusMessage: "រកមិនឃើញប្រភេទអតិថិជននេះទេ" });
    }
    console.error("[client-type/delete]", e);
    throw createError({ statusCode: 500, statusMessage: "មិនអាចលុបបានទេ" });
  }
});
