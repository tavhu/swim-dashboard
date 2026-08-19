/**
 * ប្រភេទសេវា/ជំនួយ សម្រាប់ការបញ្ជូន — the referral dropdown's source list.
 *
 * `activeOnly` is what the referral form asks for: a type withdrawn from use
 * should not be offered on a new referral, but must still resolve on the old
 * referrals that already name it, which is why it is deactivated rather than
 * deleted.
 */
export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const activeOnly = q?.activeOnly === "true" || q?.activeOnly === "1";
  const data = await event.context.prisma.referralServiceType.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { nameKh: "asc" },
  });
  return { data, total: data.length };
});
