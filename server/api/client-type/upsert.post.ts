/**
 * Create or update a ប្រភេទអតិថិជន.
 *
 * `code` is left out of the payload entirely when the admin did not type one,
 * so the column default (a sequence, see the client_type_code_autogenerate
 * migration) issues CT001, CT002 … Sending `""` instead would violate the
 * unique constraint on the second blank row, which is why it is stripped here
 * rather than passed through.
 */
export default eventHandler(async (event) => {
  const prisma = event.context.prisma;

  try {
    const body = await readBody(event);
    const { id } = body ?? {};

    const nameKh = String(body?.nameKh ?? "").trim();
    if (!nameKh) {
      throw createError({ statusCode: 400, statusMessage: "សូមបញ្ចូលឈ្មោះប្រភេទអតិថិជន" });
    }

    const text = (v: any) => {
      const s = String(v ?? "").trim();
      return s === "" ? null : s;
    };

    const data: any = {
      nameKh,
      nameEn: text(body?.nameEn),
      description: text(body?.description),
      isActive: body?.isActive === undefined ? true : Boolean(body.isActive),
    };

    const code = text(body?.code);
    // On create, omitting the key lets the default fire. On update, omitting it
    // leaves the existing code alone — a blank field in the edit form means
    // "unchanged", not "erase the code", which the NOT NULL column would refuse
    // anyway.
    if (code) data.code = code;

    const row = id
      ? await prisma.clientType.update({ where: { id }, data })
      : await prisma.clientType.create({ data });

    return { statusCode: 200, data: row };
  } catch (e: any) {
    if (e?.statusCode) throw e;

    // A duplicate code or name is the admin's mistake, not a server fault, and
    // a 500 would tell them nothing about which field to change.
    if (e?.code === "P2002") {
      const target = Array.isArray(e?.meta?.target) ? e.meta.target.join(", ") : e?.meta?.target;
      throw createError({
        statusCode: 409,
        statusMessage: String(target).includes("code")
          ? "លេខកូដនេះមានរួចហើយ សូមប្រើលេខកូដផ្សេង"
          : "ប្រភេទអតិថិជននេះមានរួចហើយ",
      });
    }
    if (e?.code === "P2025") {
      throw createError({ statusCode: 404, statusMessage: "រកមិនឃើញប្រភេទអតិថិជននេះទេ" });
    }

    console.error("[client-type/upsert]", e);
    throw createError({ statusCode: 500, statusMessage: "មិនអាចរក្សាទុកបានទេ" });
  }
});
