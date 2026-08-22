/**
 * Human-readable names for activity-log summaries.
 *
 * Summaries are read by people scanning a log page, so "client
 * cmt2uposy000c10tl60289l6t" is a failure even though it is technically
 * correct. Clients carry an issued ReadableCode (C00012); everything else has
 * a name column. These helpers resolve ids to those labels once, at log time.
 */

type Prisma = any;

/**
 * The client's C##### code, falling back to the raw id only when the row no
 * longer exists (a delete racing the log write).
 */
export async function clientCode(prisma: Prisma, clientId?: string | null): Promise<string> {
  if (!clientId) return "unknown client";
  const row = await prisma.client_PersonalInformation.findUnique({
    where: { id: clientId },
    select: { ReadableCode: true },
  });
  return row?.ReadableCode ?? clientId;
}

/** Best human label for a staff row (either table), or the id as fallback. */
export async function staffName(
  prisma: Prisma,
  id?: string | null,
  kind?: "contract" | "govern" | null,
): Promise<string> {
  if (!id) return "unknown staff";
  if (kind !== "govern") {
    const s = await prisma.staff.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, fullnameEN: true },
    });
    if (s) {
      return [s.firstName, s.lastName].filter(Boolean).join(" ") || s.fullnameEN || id;
    }
    if (kind === "contract") return id;
  }
  const g = await prisma.governStaff.findUnique({
    where: { id },
    select: { firstNameKH: true, lastNameKH: true, firstNameEN: true },
  });
  return g ? [g.firstNameKH, g.lastNameKH].filter(Boolean).join(" ") || g.firstNameEN || id : id;
}
