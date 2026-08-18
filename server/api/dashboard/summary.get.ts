/**
 * Everything the dashboard shows, in one request.
 *
 * The page had hardcoded numbers — "គណនីសរុប 30", "អ្នកប្រើប្រាស់ថ្ងៃនេះ 150 +3%"
 * — which were never wired to anything. These are the real counts.
 *
 * Aggregated on the server rather than by shipping rows to the browser: a
 * ministry overview asks "how many", and a client row carries national IDs,
 * drug histories and family contacts that a count does not need.
 */
import { getAuthUser } from "../../utils/authorize";

export default eventHandler(async (event) => {
  const prisma = event.context.prisma;

  /**
   * Centre scope.
   *
   * The client list is scoped to the caller's centre; this was not, so a centre
   * user saw "2 total clients" over a list holding one — the tile disagreed with
   * the page it links to. Worse than the arithmetic, the recent-activity table
   * was showing other centres' approvals, with the officer's name and their
   * stated reason on each row.
   *
   * A user with no centre (the ministry view) sees everything, exactly as
   * before. `centerScopeFilter` is the same helper the list endpoints use.
   */
  const user = await getAuthUser(event);
  const centreId = user?.serviceCenterID ?? null;

  /** For queries on Client_PersonalInformation itself. */
  const clientWhere: any = centreId ? { serviceCenterID: centreId } : {};
  /** For ទម្រង់ទី២-៦, which reach the centre through their client. */
  const viaClient: any = centreId ? { client: { serviceCenterID: centreId } } : {};

  /**
   * The six forms, in the order a case moves through them.
   *
   * `formKey` is the translation key the page looks up (form.f1 … form.f6);
   * `key` stays the ApprovalRecordType value, which is what the approval rows
   * are grouped by.
   */
  const FORMS = [
    { key: "CLIENT", formKey: "f1", delegate: prisma.client_PersonalInformation },
    { key: "CLIENT_SERVICE", formKey: "f2", delegate: prisma.clientService },
    { key: "CASE_PLAN", formKey: "f3", delegate: prisma.casePlan },
    { key: "REINTEGRATION", formKey: "f4", delegate: prisma.reintegration },
    { key: "FOLLOW_UP", formKey: "f5", delegate: prisma.followUp },
    { key: "CASE_CLOSURE", formKey: "f6", delegate: prisma.caseClosure },
  ];

  try {
    const [
      totalClients,
      totalCentres,
      totalServices,
      closedClients,
      // Reaching each stage is counted per client, not per record: a client with
      // three follow-up visits has still reached stage five once. That is what
      // makes the funnel answer "where do cases stall".
      reachedService,
      reachedPlan,
      reachedReintegration,
      reachedFollowUp,
      byGender,
      byProvince,
      byCentre,
      closureOutcomes,
      intakeDates,
      dobs,
      centres,
      recentEvents,
      actors,
    ] = await Promise.all([
      prisma.client_PersonalInformation.count({ where: clientWhere }),
      // A centre user counts their own centre, not the country's.
      prisma.serviceCenter.count(centreId ? { where: { id: centreId } } : undefined),
      // Not scoped, deliberately. Services are a national catalogue, and which
      // centre offers which is held in ServicesOnServiceCenters — a table that
      // is currently empty, so scoping this would report "0 services" to every
      // centre user while three exist. An unmaintained link is not evidence that
      // a centre offers nothing. Worth scoping once that table is populated.
      prisma.service.count({ where: { isActive: true } }),
      prisma.client_PersonalInformation.count({ where: { ...clientWhere, caseClosures: { some: {} } } }),
      prisma.client_PersonalInformation.count({ where: { ...clientWhere, clientServices: { some: {} } } }),
      prisma.client_PersonalInformation.count({ where: { ...clientWhere, casePlans: { some: {} } } }),
      prisma.client_PersonalInformation.count({ where: { ...clientWhere, reintegrations: { some: {} } } }),
      prisma.client_PersonalInformation.count({ where: { ...clientWhere, followUps: { some: {} } } }),
      prisma.client_PersonalInformation.groupBy({ by: ["Gender"], where: clientWhere, _count: { _all: true } }),
      prisma.client_PersonalInformation.groupBy({ by: ["cityProBA"], where: clientWhere, _count: { _all: true } }),
      prisma.client_PersonalInformation.groupBy({ by: ["serviceCenterID"], where: clientWhere, _count: { _all: true } }),
      prisma.caseClosure.groupBy({ by: ["outcome"], where: viaClient, _count: { _all: true } }),
      // Only the column needed for the trend, not the rows.
      prisma.client_PersonalInformation.findMany({ where: clientWhere, select: { InterViewDate: true } }),
      prisma.client_PersonalInformation.findMany({ where: clientWhere, select: { DOB: true } }),
      prisma.serviceCenter.findMany({ select: { id: true, nameKH: true } }),
      // Filtered below by the record ids this caller may see: ApprovalEvent
      // holds recordId as a plain string, so it cannot be joined to a centre.
      prisma.approvalEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: centreId ? 200 : 8,
        select: { recordType: true, recordId: true, fromStatus: true, toStatus: true, createdAt: true, actorID: true, reason: true },
      }),
      prisma.user.findMany({ select: { id: true, firstname: true, lastname: true, username: true } }),
    ]);

    // Approval status per form, one groupBy each.
    const approval = await Promise.all(
      FORMS.map(async (f) => {
        const rows = await (f.delegate as any).groupBy({
          by: ["approvalStatus"],
          // ទម្រង់ទី១ is the client, so it scopes on its own column; the rest
          // reach the centre through theirs.
          where: f.key === "CLIENT" ? clientWhere : viaClient,
          _count: { _all: true },
        });
        const of = (s: string) => rows.find((r: any) => r.approvalStatus === s)?._count?._all ?? 0;
        return {
          key: f.key,
          formKey: f.formKey,
          DRAFT: of("DRAFT"),
          SUBMITTED: of("SUBMITTED"),
          APPROVED: of("APPROVED"),
          REJECTED: of("REJECTED"),
        };
      })
    );

    const awaitingApproval = approval.reduce((n, f) => n + f.SUBMITTED, 0);

    /** Twelve months back including this one, so an empty month still shows. */
    const now = new Date();
    // Year and month only. The month name was formatted here with a fixed
    // en-GB locale, which left the trend axis in English whatever the language
    // picker said; the page formats it now.
    const months: { key: string; year: number; month: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        count: 0,
      });
    }
    const monthIndex = new Map(months.map((m, i) => [m.key, i]));
    for (const row of intakeDates) {
      if (!row.InterViewDate) continue;
      const d = new Date(row.InterViewDate);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const i = monthIndex.get(k);
      if (i !== undefined) months[i].count++;
    }

    /** Age bands, derived from DOB — the schema stores no age, correctly. */
    // Keys, not text: the band reads "០-៥" in Khmer and "0–5" in English, and
    // which one is a decision for the page, not for the query. Everything this
    // endpoint labels itself would otherwise be frozen in one language.
    const BANDS = [
      { key: "b0_5", min: 0, max: 5 },
      { key: "b6_12", min: 6, max: 12 },
      { key: "b13_17", min: 13, max: 17 },
      { key: "b18_25", min: 18, max: 25 },
      { key: "b26_40", min: 26, max: 40 },
      { key: "b41_60", min: 41, max: 60 },
      { key: "b61plus", min: 61, max: 200 },
    ];
    const ageBands = BANDS.map((b) => ({ key: b.key, count: 0 }));
    let ageUnknown = 0;
    for (const row of dobs) {
      if (!row.DOB) { ageUnknown++; continue; }
      const d = new Date(row.DOB);
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
      const i = BANDS.findIndex((b) => age >= b.min && age <= b.max);
      if (i >= 0) ageBands[i].count++;
      else ageUnknown++;
    }

    /**
     * Which approval events this caller may see.
     *
     * ApprovalEvent.recordId is a plain string rather than a foreign key, so
     * there is no join to a centre — the ids have to be gathered and matched.
     * Without this a centre user read every other centre's approval history,
     * including who decided and the reason they gave.
     *
     * Only for a centre user; the ministry view keeps the unfiltered list.
     */
    let visibleEvents = recentEvents;
    if (centreId) {
      const [cIds, sIds, pIds, rIds, fIds, xIds] = await Promise.all([
        prisma.client_PersonalInformation.findMany({ where: clientWhere, select: { id: true } }),
        prisma.clientService.findMany({ where: viaClient, select: { id: true } }),
        prisma.casePlan.findMany({ where: viaClient, select: { id: true } }),
        prisma.reintegration.findMany({ where: viaClient, select: { id: true } }),
        prisma.followUp.findMany({ where: viaClient, select: { id: true } }),
        prisma.caseClosure.findMany({ where: viaClient, select: { id: true } }),
      ]);
      const mine = new Set(
        [cIds, sIds, pIds, rIds, fIds, xIds].flat().map((r: any) => r.id)
      );
      visibleEvents = recentEvents.filter((e: any) => mine.has(e.recordId)).slice(0, 8);
    }

    const centreName = new Map(centres.map((c) => [c.id, c.nameKH]));
    const actorName = new Map(
      actors.map((u) => [u.id, [u.firstname, u.lastname].filter(Boolean).join(" ") || u.username])
    );

    return {
      totals: {
        clients: totalClients,
        centres: totalCentres,
        services: totalServices,
        // A case with no ទម្រង់ទី៦ on it is still open. Derived rather than stored,
        // because filing a closure deliberately does not change the client row.
        openCases: totalClients - closedClients,
        closedCases: closedClients,
        awaitingApproval,
      },
      funnel: [
        { key: "register", form: "f1", count: totalClients },
        { key: "service", form: "f2", count: reachedService },
        { key: "plan", form: "f3", count: reachedPlan },
        { key: "reintegration", form: "f4", count: reachedReintegration },
        { key: "followUp", form: "f5", count: reachedFollowUp },
        { key: "closure", form: "f6", count: closedClients },
      ],
      approval,
      intakeByMonth: months,
      // The sex itself is a field value and is passed through as stored. Only
      // the stand-in for a missing one is a label, so only that is a key.
      gender: byGender
        .map((g: any) => ({ label: g.Gender || null, labelKey: g.Gender ? null : "common.unspecified", count: g._count._all }))
        .sort((a: any, b: any) => b.count - a.count),
      ageBands,
      ageUnknown,
      provinces: byProvince
        .map((p: any) => ({ code: p.cityProBA, count: p._count._all }))
        .sort((a, b) => b.count - a.count),
      // Centre names are entity names — field values — so they are not
      // translated; only the stand-in for an unassigned one is.
      centres: byCentre
        .map((c: any) => ({
          label: centreName.get(c.serviceCenterID) ?? null,
          labelKey: centreName.get(c.serviceCenterID) ? null : "common.unassigned",
          count: c._count._all,
        }))
        .sort((a: any, b: any) => b.count - a.count),
      closureOutcomes: {
        successful: closureOutcomes.find((o: any) => o.outcome === "SUCCESSFUL")?._count?._all ?? 0,
        unsuccessful: closureOutcomes.find((o: any) => o.outcome === "UNSUCCESSFUL")?._count?._all ?? 0,
      },
      recentEvents: visibleEvents.map((e: any) => ({
        recordType: e.recordType,
        fromStatus: e.fromStatus,
        toStatus: e.toStatus,
        createdAt: e.createdAt,
        actor: actorName.get(e.actorID) ?? "—",
        reason: e.reason,
      })),
    };
  } catch (e: any) {
    console.error("[dashboard/summary]", e);
    // The page shows its own translated message; this is for the log.
    throw createError({ statusCode: 500, statusMessage: "Could not build the dashboard summary" });
  }
});
