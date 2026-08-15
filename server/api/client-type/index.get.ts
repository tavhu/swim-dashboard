/**
 * ប្រភេទអតិថិជន list for the settings screen.
 *
 * Soft-deleted rows (`isActive: false`) are hidden here, as they are in the
 * ទម្រង់ទី២ dropdown — but a category already chosen on an existing record still
 * resolves through its relation, so retiring a category never blanks history.
 */
export default eventHandler(async (event) => {
  const prisma = event.context.prisma;

  try {
    const query = getQuery(event);
    const limit = parseInt(query.limit as string, 10) || 10;
    const offset = parseInt(query.offset as string, 10) || 0;
    const search = (query.search as string) || "";
    const sortBy = (query.sortBy as string) || "createdAt";
    const sortType = (query.sortType as "asc" | "desc") || "desc";

    // Only columns that exist and are sensible to order by. Passing an unknown
    // field straight to Prisma throws, which would turn a stray query string
    // into a 500.
    const SORTABLE = ["code", "nameKh", "nameEn", "createdAt", "updatedAt"];
    const orderBy = { [SORTABLE.includes(sortBy) ? sortBy : "createdAt"]: sortType };

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { nameKh: { contains: search, mode: "insensitive" } },
        { nameEn: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.clientType.findMany({ where, orderBy, take: limit, skip: offset }),
      prisma.clientType.count({ where }),
    ]);

    return { data, total };
  } catch (e: any) {
    console.error("[client-type/index]", e);
    throw createError({ statusCode: 500, statusMessage: "មិនអាចទាញយកបញ្ជីប្រភេទអតិថិជនបានទេ" });
  }
});
