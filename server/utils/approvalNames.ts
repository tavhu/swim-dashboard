import type { H3Event } from "h3";

/**
 * Resolve សិទ្ធិអនុម័ត's two actors to names.
 *
 * `submittedByID` and `decidedByID` are plain String columns rather than
 * relations — the same shape as `InterviewerID` on ទម្រង់ទី១ — so Prisma cannot
 * `include` them and they arrive as opaque cuids. ApprovalPanel has always had
 * `submittedByName` and `decidedByName` props and has always rendered them; no
 * endpoint ever supplied the values, so both read "—" on all six forms.
 *
 * One lookup for both ids, and only the name columns: an approval block showing
 * who signed off does not need the rest of a user row, and /api/center/getSingle
 * is the reminder of what selecting whole User rows costs.
 */
export async function approverNames(
  event: H3Event,
  record: { submittedByID?: string | null; decidedByID?: string | null } | null | undefined
): Promise<{ submittedByName: string | null; decidedByName: string | null }> {
  const ids = [record?.submittedByID, record?.decidedByID].filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );
  if (!ids.length) return { submittedByName: null, decidedByName: null };

  const users = await event.context.prisma.user.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, firstname: true, lastname: true, username: true },
  });

  /** Their name as a person, falling back to the account name. */
  const nameOf = (id?: string | null) => {
    if (!id) return null;
    const u = users.find((x: any) => x.id === id);
    if (!u) return null;
    const full = [u.firstname, u.lastname].filter(Boolean).join(" ").trim();
    return full || u.username || null;
  };

  return {
    submittedByName: nameOf(record?.submittedByID),
    decidedByName: nameOf(record?.decidedByID),
  };
}

/** The record with both names attached, ready to return from a handler. */
export async function withApproverNames<T extends Record<string, any>>(
  event: H3Event,
  record: T | null
): Promise<T | null> {
  if (!record) return record;
  return { ...record, ...(await approverNames(event, record)) };
}
