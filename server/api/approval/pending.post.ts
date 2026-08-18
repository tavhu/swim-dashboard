import { KHMER_DIGIT } from "../../../shared/formPipeline";

/**
 * Everything waiting on a decision, across all six ទម្រង់, as one list.
 *
 * Without this an approver has to go looking: open the client list, open a
 * client, open each form in turn, and see whether anything is amber. The work
 * they are responsible for was visible only one record at a time, which is not a
 * queue — it is a search.
 *
 * Six queries rather than one because the records live in six tables with
 * nothing in common but the approval columns. They run together and are merged
 * oldest-first, since the point of a queue is what has been waiting longest.
 *
 * Scoped to the caller's centre like every other read. A ministry-level user has
 * no centre and sees all of them, which is what makes this useful at that level
 * too.
 */

/** The six forms, and how to reach each record's own page from the queue. */
const SOURCES = [
  {
    form: 1,
    recordType: "CLIENT",
    nameKh: "ព័ត៌មានអតិថិជន",
    href: (r: any) => `/client/id/${r.id}`,
  },
  {
    form: 2,
    recordType: "CLIENT_SERVICE",
    nameKh: "ការប្រើសេវាកម្ម",
    href: (r: any) => `/client/service/view/${r.id}`,
  },
  {
    form: 3,
    recordType: "CASE_PLAN",
    nameKh: "ផែនការករណី",
    href: (r: any) => `/client/case-plan/view/${r.id}`,
  },
  {
    form: 4,
    recordType: "REINTEGRATION",
    nameKh: "សមាហរណកម្ម",
    href: (r: any) => `/client/reintegration/view/${r.id}`,
  },
  {
    form: 5,
    recordType: "FOLLOW_UP",
    nameKh: "ការតាមដាន",
    href: (r: any) => `/client/follow-up/view/${r.id}`,
  },
  {
    form: 6,
    recordType: "CASE_CLOSURE",
    nameKh: "ការបិទករណី",
    href: (r: any) => `/client/case-closure/view/${r.id}`,
  },
] as const;

export default defineEventHandler(async (event) => {
  const caller = await getAuthUser(event);
  if (!caller) {
    setResponseStatus(event, 401);
    return { data: [], total: 0 };
  }

  const prisma = event.context.prisma;
  const centre = caller.serviceCenterID;

  // ទម្រង់ទី១ holds the centre itself; ទម្រង់ទី២-៦ reach it through their client.
  const clientWhere = centre ? { serviceCenterID: centre } : {};
  const episodeWhere = centre ? { client: { serviceCenterID: centre } } : {};

  const client = { select: { id: true, ReadableCode: true, fullNameKH: true, photo: true } };

  const [clients, services, plans, reints, follows, closures] = await Promise.all([
    prisma.client_PersonalInformation.findMany({
      where: { approvalStatus: "SUBMITTED", ...clientWhere },
      select: { id: true, ReadableCode: true, fullNameKH: true, photo: true, submittedAt: true, submittedByID: true },
    }),
    ...[
      prisma.clientService,
      prisma.casePlan,
      prisma.reintegration,
      prisma.followUp,
      prisma.caseClosure,
    ].map((d: any) =>
      d.findMany({
        where: { approvalStatus: "SUBMITTED", ...episodeWhere },
        select: { id: true, submittedAt: true, submittedByID: true, client },
      })
    ),
  ]);

  const grouped = [clients, services, plans, reints, follows, closures];

  // One lookup for every submitter across all six lists, rather than per row.
  const ids = grouped.flat().map((r: any) => r.submittedByID).filter(Boolean);
  const users = ids.length
    ? await prisma.user.findMany({
        where: { id: { in: [...new Set(ids)] } },
        select: { id: true, firstname: true, lastname: true, username: true },
      })
    : [];
  const nameOf = (id?: string | null) => {
    const u = users.find((x: any) => x.id === id);
    if (!u) return null;
    return [u.firstname, u.lastname].filter(Boolean).join(" ").trim() || u.username;
  };

  const data = grouped.flatMap((rows: any[], i) => {
    const src = SOURCES[i];
    return rows.map((r: any) => {
      // ទម្រង់ទី១ is the client, so it is its own subject.
      const c = src.form === 1 ? r : r.client;
      return {
        id: r.id,
        form: src.form,
        formLabel: `${KHMER_DIGIT[src.form]}`,
        formNameKh: src.nameKh,
        recordType: src.recordType,
        href: src.href(r),
        clientId: c?.id ?? null,
        clientCode: c?.ReadableCode ?? null,
        clientName: c?.fullNameKH ?? null,
        clientPhoto: c?.photo ?? null,
        submittedAt: r.submittedAt,
        submittedByName: nameOf(r.submittedByID),
      };
    });
  });

  // Oldest first: the queue is about what has been waiting, not what is newest.
  data.sort((a, b) => {
    const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
    const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
    return ta - tb;
  });

  return {
    data,
    total: data.length,
    /** Per-form counts, so the page can show where the backlog actually is. */
    byForm: SOURCES.map((s, i) => ({ form: s.form, count: grouped[i].length })),
  };
});
