import gazetteers from "../../store/data/gazetteers";

/**
 * The report catalogue.
 *
 * One definition per report, holding both its columns and its query, so the
 * on-screen table and every download come from the same place. The alternative —
 * a query for the screen and another for the spreadsheet — is how an exported
 * figure ends up disagreeing with the one the official just read.
 *
 * Formats: Excel and Word are generated from these rows server-side; PDF is the
 * browser printing the preview. jspdf is installed but embeds no Khmer glyphs,
 * so a jspdf report would come out as boxes — the same reason every ទម្រង់ prints
 * through window.print() and @media print instead.
 */

export interface ReportColumn {
  key: string;
  label: string;
  /** Right-aligned and treated as a number in Excel. */
  numeric?: boolean;
  width?: number;
}

export interface ReportFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  centreId?: string | null;
  provinceCode?: string | null;
}

export interface ReportDefinition {
  key: string;
  title: string;
  description: string;
  /** Which filter controls the page should offer for this report. */
  filters: ("date" | "centre" | "province")[];
  columns: ReportColumn[];
  run(prisma: any, f: ReportFilters): Promise<Record<string, any>[]>;
}

const provinceName = (code?: string | null) =>
  (gazetteers as any[]).find((p) => p.code === code)?.name?.km ?? code ?? "—";

const fmtDate = (d?: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const ageFrom = (dob?: Date | string | null) => {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
};

const STATUS_KH: Record<string, string> = {
  DRAFT: "ព្រាង",
  SUBMITTED: "បានស្នើសុំ",
  APPROVED: "បានអនុម័ត",
  REJECTED: "បានបដិសេធ",
};

/** A date range over one column, only where both ends are given. */
const between = (f: ReportFilters, field: string) => {
  const where: any = {};
  if (f.dateFrom) where.gte = new Date(f.dateFrom);
  if (f.dateTo) {
    // Inclusive of the whole end day, which is what a user picking a date means.
    const to = new Date(f.dateTo);
    to.setHours(23, 59, 59, 999);
    where.lte = to;
  }
  return Object.keys(where).length ? { [field]: where } : {};
};

const clientScope = (f: ReportFilters) => ({
  ...(f.centreId ? { serviceCenterID: f.centreId } : {}),
  ...(f.provinceCode ? { cityProBA: f.provinceCode } : {}),
});

export const REPORTS: ReportDefinition[] = [
  // ---------------------------------------------------------------- clients
  {
    key: "clients",
    title: "របាយការណ៍បញ្ជីអតិថិជន",
    description: "បញ្ជីអតិថិជនទាំងអស់ ជាមួយនឹងវឌ្ឍនភាពតាមទម្រង់នីមួយៗ",
    filters: ["date", "centre", "province"],
    columns: [
      { key: "code", label: "លេខសំគាល់", width: 12 },
      { key: "name", label: "ឈ្មោះអតិថិជន", width: 26 },
      { key: "sex", label: "ភេទ", width: 8 },
      { key: "age", label: "អាយុ", numeric: true, width: 7 },
      { key: "centre", label: "មជ្ឈមណ្ឌល", width: 30 },
      { key: "province", label: "ខេត្ត", width: 18 },
      { key: "intake", label: "កាលបរិច្ឆេទសម្ភាសន៍", width: 18 },
      { key: "status", label: "ស្ថានភាពអនុម័ត", width: 14 },
      { key: "formsDone", label: "ទម្រង់បានបំពេញ", width: 16 },
      { key: "closed", label: "បិទករណី", width: 10 },
    ],
    async run(prisma, f) {
      const rows = await prisma.client_PersonalInformation.findMany({
        where: { ...clientScope(f), ...between(f, "InterViewDate") },
        orderBy: { ReadableCode: "asc" },
        select: {
          ReadableCode: true, fullNameKH: true, Gender: true, DOB: true,
          cityProBA: true, InterViewDate: true, approvalStatus: true,
          ServiceCenter: { select: { nameKH: true } },
          _count: {
            select: {
              clientServices: true, casePlans: true, reintegrations: true,
              followUps: true, caseClosures: true,
            },
          },
        },
      });
      return rows.map((c: any) => {
        // ទម្រង់ទី១ always exists for a row in this table; the other five count
        // as done once the client has at least one of them.
        const done = 1
          + (c._count.clientServices ? 1 : 0)
          + (c._count.casePlans ? 1 : 0)
          + (c._count.reintegrations ? 1 : 0)
          + (c._count.followUps ? 1 : 0)
          + (c._count.caseClosures ? 1 : 0);
        return {
          code: c.ReadableCode ?? "—",
          name: c.fullNameKH ?? "—",
          sex: c.Gender ?? "—",
          age: ageFrom(c.DOB) ?? "—",
          centre: c.ServiceCenter?.nameKH ?? "—",
          province: provinceName(c.cityProBA),
          intake: fmtDate(c.InterViewDate),
          status: STATUS_KH[c.approvalStatus] ?? c.approvalStatus,
          formsDone: `${done}/6`,
          closed: c._count.caseClosures ? "បាទ/ចាស" : "ទេ",
        };
      });
    },
  },

  // --------------------------------------------------------------- services
  {
    key: "services",
    title: "របាយការណ៍សេវាកម្មដែលបានផ្តល់",
    description: "សេវាកម្មនីមួយៗ និងចំនួនដងដែលបានផ្តល់ តាមទម្រង់ទី២ ដល់ទី៥",
    filters: ["date"],
    columns: [
      { key: "code", label: "លេខកូដ", width: 12 },
      { key: "service", label: "ឈ្មោះសេវាកម្ម", width: 46 },
      { key: "institution", label: "ស្ថាប័នផ្តល់សេវា", width: 26 },
      { key: "form2", label: "ទម្រង់ទី២", numeric: true, width: 10 },
      { key: "form3", label: "ទម្រង់ទី៣", numeric: true, width: 10 },
      { key: "form4", label: "ទម្រង់ទី៤", numeric: true, width: 10 },
      { key: "form5", label: "ទម្រង់ទី៥", numeric: true, width: 10 },
      { key: "total", label: "សរុប", numeric: true, width: 10 },
    ],
    async run(prisma, f) {
      const dateOn = (field: string) => between(f, field);
      const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
        select: { id: true, code: true, nameKh: true, providingInstitution: true },
      });

      const [f2, f3, f4past, f4comm, f5] = await Promise.all([
        prisma.clientService.groupBy({
          by: ["serviceId"], _count: { _all: true }, where: dateOn("serviceDate"),
        }),
        prisma.casePlanActivity.groupBy({
          by: ["serviceId"], _count: { _all: true }, where: dateOn("startDate"),
        }),
        prisma.reintegrationPastService.groupBy({
          by: ["serviceId"], _count: { _all: true }, where: dateOn("startDate"),
        }),
        prisma.reintegrationCommunityService.groupBy({
          by: ["serviceId"], _count: { _all: true }, where: dateOn("startDate"),
        }),
        prisma.followUpService.groupBy({
          by: ["serviceId"], _count: { _all: true }, where: dateOn("startDate"),
        }),
      ]);
      const tally = (rows: any[]) =>
        new Map(rows.filter((r) => r.serviceId).map((r) => [r.serviceId, r._count._all]));
      const [m2, m3, m4a, m4b, m5] = [f2, f3, f4past, f4comm, f5].map(tally);

      return services
        .map((s: any) => {
          const c2 = m2.get(s.id) ?? 0;
          const c3 = m3.get(s.id) ?? 0;
          // ទម្រង់ទី៤ asks for services twice — already delivered and to
          // continue — and both are services provided under this form.
          const c4 = (m4a.get(s.id) ?? 0) + (m4b.get(s.id) ?? 0);
          const c5 = m5.get(s.id) ?? 0;
          return {
            code: s.code ?? "—",
            service: s.nameKh,
            institution: s.providingInstitution ?? "—",
            form2: c2, form3: c3, form4: c4, form5: c5,
            total: c2 + c3 + c4 + c5,
          };
        })
        .sort((a, b) => b.total - a.total);
    },
  },

  // --------------------------------------------------------------- outcomes
  {
    key: "outcomes",
    title: "របាយការណ៍លទ្ធផលបិទករណី",
    description: "ករណីដែលបានបិទ តាមលទ្ធផល និងមូលហេតុ (ទម្រង់ទី៦)",
    filters: ["date", "centre"],
    columns: [
      { key: "code", label: "លេខសំគាល់", width: 12 },
      { key: "name", label: "ឈ្មោះអតិថិជន", width: 26 },
      { key: "centre", label: "មជ្ឈមណ្ឌល", width: 28 },
      { key: "outcome", label: "លទ្ធផល", width: 20 },
      { key: "reason", label: "មូលហេតុ", width: 52 },
      { key: "closedOn", label: "កាលបរិច្ឆេទបិទ", width: 16 },
      { key: "status", label: "ស្ថានភាពអនុម័ត", width: 14 },
    ],
    async run(prisma, f) {
      const rows = await prisma.caseClosure.findMany({
        where: {
          ...between(f, "createdAt"),
          ...(f.centreId ? { client: { serviceCenterID: f.centreId } } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: {
          outcome: true, successReason: true, successReasonOther: true,
          failureReasons: true, createdAt: true, approvalStatus: true,
          client: {
            select: { ReadableCode: true, fullNameKH: true, ServiceCenter: { select: { nameKH: true } } },
          },
        },
      });
      return rows.map((r: any) => {
        const reason = r.outcome === "SUCCESSFUL"
          ? (r.successReason === "ផ្សេងទៀត" && r.successReasonOther
              ? `${r.successReason}: ${r.successReasonOther}`
              : r.successReason ?? "—")
          : String(r.failureReasons ?? "").split(",").filter(Boolean).join(" / ") || "—";
        return {
          code: r.client?.ReadableCode ?? "—",
          name: r.client?.fullNameKH ?? "—",
          centre: r.client?.ServiceCenter?.nameKH ?? "—",
          outcome: r.outcome === "SUCCESSFUL" ? "សមាហរណកម្មជោគជ័យ" : "សមាហរណកម្មមិនជោគជ័យ",
          reason,
          closedOn: fmtDate(r.createdAt),
          status: STATUS_KH[r.approvalStatus] ?? r.approvalStatus,
        };
      });
    },
  },

  // --------------------------------------------------------------- approval
  {
    key: "approval",
    title: "របាយការណ៍ស្ថានភាពការអនុម័ត",
    description: "កំណត់ត្រាដែលកំពុងរង់ចាំការអនុម័ត និងរយៈពេលរង់ចាំ",
    filters: ["centre"],
    columns: [
      { key: "form", label: "ទម្រង់", width: 26 },
      { key: "code", label: "លេខសំគាល់អតិថិជន", width: 16 },
      { key: "name", label: "ឈ្មោះអតិថិជន", width: 26 },
      { key: "centre", label: "មជ្ឈមណ្ឌល", width: 28 },
      { key: "status", label: "ស្ថានភាព", width: 14 },
      { key: "submitted", label: "ថ្ងៃស្នើសុំ", width: 16 },
      { key: "waitingDays", label: "រង់ចាំ (ថ្ងៃ)", numeric: true, width: 12 },
    ],
    async run(prisma, f) {
      const centre = f.centreId ? { client: { serviceCenterID: f.centreId } } : {};
      const sel = {
        approvalStatus: true, submittedAt: true,
        client: { select: { ReadableCode: true, fullNameKH: true, ServiceCenter: { select: { nameKH: true } } } },
      };
      const [s2, s3, s4, s5, s6, s1] = await Promise.all([
        prisma.clientService.findMany({ where: { approvalStatus: "SUBMITTED", ...centre }, select: sel }),
        prisma.casePlan.findMany({ where: { approvalStatus: "SUBMITTED", ...centre }, select: sel }),
        prisma.reintegration.findMany({ where: { approvalStatus: "SUBMITTED", ...centre }, select: sel }),
        prisma.followUp.findMany({ where: { approvalStatus: "SUBMITTED", ...centre }, select: sel }),
        prisma.caseClosure.findMany({ where: { approvalStatus: "SUBMITTED", ...centre }, select: sel }),
        // ទម្រង់ទី១ is the client itself, so it has no `client` relation to read.
        prisma.client_PersonalInformation.findMany({
          where: { approvalStatus: "SUBMITTED", ...(f.centreId ? { serviceCenterID: f.centreId } : {}) },
          select: {
            approvalStatus: true, submittedAt: true, ReadableCode: true, fullNameKH: true,
            ServiceCenter: { select: { nameKH: true } },
          },
        }),
      ]);

      const now = Date.now();
      const days = (d?: Date | null) =>
        d ? Math.max(0, Math.floor((now - new Date(d).getTime()) / 86_400_000)) : "—";

      const mapped = [
        ...s1.map((r: any) => ({
          form: "ទម្រង់ទី១ បញ្ជីអតិថិជន", code: r.ReadableCode ?? "—", name: r.fullNameKH ?? "—",
          centre: r.ServiceCenter?.nameKH ?? "—", status: STATUS_KH[r.approvalStatus],
          submitted: fmtDate(r.submittedAt), waitingDays: days(r.submittedAt), _t: r.submittedAt,
        })),
        ...[
          ["ទម្រង់ទី២ ការប្រើសេវាកម្ម", s2], ["ទម្រង់ទី៣ ផែនការករណី", s3],
          ["ទម្រង់ទី៤ សមាហរណកម្ម", s4], ["ទម្រង់ទី៥ តាមដាន និងវាយតម្លៃ", s5],
          ["ទម្រង់ទី៦ បិទករណី", s6],
        ].flatMap(([label, rows]: any) =>
          rows.map((r: any) => ({
            form: label, code: r.client?.ReadableCode ?? "—", name: r.client?.fullNameKH ?? "—",
            centre: r.client?.ServiceCenter?.nameKH ?? "—", status: STATUS_KH[r.approvalStatus],
            submitted: fmtDate(r.submittedAt), waitingDays: days(r.submittedAt), _t: r.submittedAt,
          }))
        ),
      ];
      // Longest wait first: that is the queue an approver should work down.
      mapped.sort((a: any, b: any) => (a._t ? new Date(a._t).getTime() : Infinity) - (b._t ? new Date(b._t).getTime() : Infinity));
      return mapped.map(({ _t, ...rest }: any) => rest);
    },
  },

  // ---------------------------------------------------------------- centres
  {
    key: "centres",
    title: "របាយការណ៍មជ្ឈមណ្ឌល",
    description: "ចំនួនអតិថិជន បុគ្គលិក និងករណីបានបិទ តាមមជ្ឈមណ្ឌល",
    filters: [],
    columns: [
      { key: "centre", label: "មជ្ឈមណ្ឌល", width: 34 },
      { key: "type", label: "ប្រភេទ", width: 16 },
      { key: "province", label: "ខេត្ត", width: 18 },
      { key: "director", label: "ប្រធានមជ្ឈមណ្ឌល", width: 22 },
      { key: "phone", label: "លេខទំនាក់ទំនង", width: 16 },
      { key: "clients", label: "អតិថិជន", numeric: true, width: 10 },
      { key: "closed", label: "បានបិទ", numeric: true, width: 10 },
      { key: "staff", label: "បុគ្គលិក", numeric: true, width: 10 },
    ],
    async run(prisma) {
      const centres = await prisma.serviceCenter.findMany({
        orderBy: { nameKH: "asc" },
        select: {
          id: true, nameKH: true, type: true, City: true, directorName: true, phoneNumber: true,
          _count: { select: { Client_PersonalInformation: true, staff: true } },
        },
      });
      const closedPer = await prisma.client_PersonalInformation.groupBy({
        by: ["serviceCenterID"],
        _count: { _all: true },
        where: { caseClosures: { some: {} } },
      });
      const closed = new Map(closedPer.map((r: any) => [r.serviceCenterID, r._count._all]));
      return centres.map((c: any) => ({
        centre: c.nameKH,
        type: c.type ?? "—",
        province: provinceName(c.City),
        director: c.directorName ?? "—",
        phone: c.phoneNumber ?? "—",
        clients: c._count.Client_PersonalInformation,
        closed: closed.get(c.id) ?? 0,
        staff: c._count.staff,
      }));
    },
  },

  // ------------------------------------------------------------ period stats
  {
    key: "summary",
    title: "របាយការណ៍សង្ខេបតាមកាលបរិច្ឆេទ",
    description: "តួលេខសង្ខេបសម្រាប់រយៈពេលដែលបានជ្រើសរើស — សម្រាប់ដាក់ជូនថ្នាក់លើ",
    filters: ["date", "centre"],
    columns: [
      { key: "metric", label: "សូចនាករ", width: 44 },
      { key: "value", label: "ចំនួន", numeric: true, width: 12 },
    ],
    async run(prisma, f) {
      const cs = clientScope(f);
      const viaClient = f.centreId ? { client: { serviceCenterID: f.centreId } } : {};
      const [intake, closures, successful, unsuccessful, services, plans, reint, follow, pending] =
        await Promise.all([
          prisma.client_PersonalInformation.count({ where: { ...cs, ...between(f, "InterViewDate") } }),
          prisma.caseClosure.count({ where: { ...viaClient, ...between(f, "createdAt") } }),
          prisma.caseClosure.count({ where: { outcome: "SUCCESSFUL", ...viaClient, ...between(f, "createdAt") } }),
          prisma.caseClosure.count({ where: { outcome: "UNSUCCESSFUL", ...viaClient, ...between(f, "createdAt") } }),
          prisma.clientService.count({ where: { ...viaClient, ...between(f, "serviceDate") } }),
          prisma.casePlan.count({ where: { ...viaClient, ...between(f, "createdAt") } }),
          prisma.reintegration.count({ where: { ...viaClient, ...between(f, "createdAt") } }),
          prisma.followUp.count({ where: { ...viaClient, ...between(f, "monitorDate") } }),
          prisma.clientService.count({ where: { approvalStatus: "SUBMITTED", ...viaClient } }),
        ]);
      const rate = closures ? Math.round((successful / closures) * 100) : null;
      return [
        { metric: "អតិថិជនចុះឈ្មោះថ្មី", value: intake },
        { metric: "ការប្រើសេវាកម្ម (ទម្រង់ទី២)", value: services },
        { metric: "ផែនការករណី (ទម្រង់ទី៣)", value: plans },
        { metric: "សមាហរណកម្ម (ទម្រង់ទី៤)", value: reint },
        { metric: "ការតាមដាន (ទម្រង់ទី៥)", value: follow },
        { metric: "ករណីបានបិទ (ទម្រង់ទី៦)", value: closures },
        { metric: "— ក្នុងនោះ សមាហរណកម្មជោគជ័យ", value: successful },
        { metric: "— ក្នុងនោះ សមាហរណកម្មមិនជោគជ័យ", value: unsuccessful },
        { metric: "អត្រាជោគជ័យ (%)", value: rate === null ? "—" : rate },
        { metric: "ទម្រង់ទី២ រង់ចាំការអនុម័ត", value: pending },
      ];
    },
  },

  // ------------------------------------------------------------------- staff
  {
    key: "staff",
    title: "របាយការណ៍បុគ្គលិក (រដ្ឋ និងកិច្ចសន្យា)",
    description: "បុគ្គលិករដ្ឋ និងមន្ត្រីកិច្ចសន្យា ក្នុងតារាងតែមួយ ជាមួយសេចក្ដីសង្ខេបតាមមជ្ឈមណ្ឌល",
    filters: ["centre"],
    columns: [
      { key: "type", label: "ប្រភេទបុគ្គលិក", width: 16 },
      { key: "nameKH", label: "ឈ្មោះ (ខ្មែរ)", width: 26 },
      { key: "nameEN", label: "ឈ្មោះ (ឡាតាំង)", width: 24 },
      { key: "gender", label: "ភេទ", width: 8 },
      { key: "age", label: "អាយុ", numeric: true, width: 7 },
      { key: "position", label: "មុខតំណែង/ឋានៈ", width: 20 },
      { key: "phone", label: "ទូរស័ព្ទ", width: 15 },
      { key: "email", label: "អ៊ីមែល", width: 22 },
      { key: "idNumber", label: "លេខអត្តសញ្ញាណ", width: 16 },
      { key: "started", label: "ថ្ងៃចាប់ផ្តើមធ្វើការ", width: 17 },
      { key: "yearsOfService", label: "ឆ្នាំបម្រើការ", numeric: true, width: 12 },
      { key: "centre", label: "មជ្ឈមណ្ឌល", width: 28 },
    ],
    async run(prisma, f) {
      const centreWhere = f.centreId ? { serviceCenterID: f.centreId } : {};

      const [gov, contract] = await Promise.all([
        prisma.governStaff.findMany({
          where: centreWhere,
          orderBy: { firstNameKH: "asc" },
          select: {
            firstNameKH: true, lastNameKH: true, firstNameEN: true, lastNameEN: true,
            gender: true, DateofBirth: true, CurrentRank: true, OfficialLevelKH: true,
            telephone: true, email: true, officialID: true, DateStartOfficialWork: true,
            ServiceCenter: { select: { nameKH: true } },
          },
        }),
        prisma.staff.findMany({
          where: centreWhere,
          orderBy: { firstName: "asc" },
          select: {
            firstName: true, lastName: true, fullnameEN: true, gender: true,
            dateofbirth: true, position: true, telephone: true,
            workingPeroidStart: true,
            serviceCenter: { select: { nameKH: true } },
          },
        }),
      ]);

      const tenureYears = (d?: Date | string | null) => {
        if (!d) return null;
        const start = new Date(d);
        return Math.max(0, ((Date.now() - start.getTime()) / (365.25 * 86_400_000))).toFixed(1);
      };

      const govRows = gov.map((s: any) => ({
        type: "បុគ្គលិករដ្ឋ",
        nameKH: [s.lastNameKH, s.firstNameKH].filter(Boolean).join(" ") || "—",
        nameEN: [s.lastNameEN, s.firstNameEN].filter(Boolean).join(" ") || "—",
        gender: s.gender ?? "—",
        age: ageFrom(s.DateofBirth) ?? "—",
        position: [s.CurrentRank, s.OfficialLevelKH].filter(Boolean).join(" / ") || "—",
        phone: s.telephone ?? "—",
        email: s.email ?? "—",
        idNumber: s.officialID ?? "—",
        started: fmtDate(s.DateStartOfficialWork),
        yearsOfService: tenureYears(s.DateStartOfficialWork) ?? "—",
        centre: s.ServiceCenter?.nameKH ?? "—",
      }));

      const contractRows = contract.map((s: any) => ({
        type: "មន្ត្រីកិច្ចសន្យា",
        nameKH: [s.lastName, s.firstName].filter(Boolean).join(" ") || s.fullnameEN || "—",
        nameEN: s.fullnameEN || "—",
        gender: s.gender ?? "—",
        age: ageFrom(s.dateofbirth) ?? "—",
        position: s.position ?? "—",
        phone: s.telephone ?? "—",
        email: "—",
        idNumber: "—",
        started: fmtDate(s.workingPeroidStart),
        yearsOfService: tenureYears(s.workingPeroidStart) ?? "—",
        centre: s.serviceCenter?.nameKH ?? "—",
      }));

      // Gov first, then contract — stable and predictable for a ministry printout.
      return [...govRows, ...contractRows];
    },
  },
];

export const findReport = (key: unknown) =>
  REPORTS.find((r) => r.key === key);

/** A filename a ministry filing system can live with. */
export function reportFilename(def: ReportDefinition, ext: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  return `${def.key}-${stamp}.${ext}`;
}

/** Human-readable description of the filters, printed on every export. */
/**
 * The filter line printed under a report's title.
 *
 * `tr` is passed in rather than imported so this stays free of h3 — the caller
 * has the request and therefore the language; this function only has strings.
 * Defaults to identity, which is Khmer, so an existing caller is unaffected.
 */
export function describeFilters(
  f: ReportFilters,
  centreName?: string | null,
  tr: (s: string) => string = (s) => s
) {
  const bits: string[] = [];
  if (f.dateFrom || f.dateTo) {
    const from = f.dateFrom ? fmtDate(f.dateFrom) : tr("ដើមគ្រា");
    const to = f.dateTo ? fmtDate(f.dateTo) : tr("បច្ចុប្បន្ន");
    bits.push(`${tr("កាលបរិច្ឆេទ៖")} ${from} — ${to}`);
  }
  // Centre and province names are data and stay as recorded.
  if (centreName) bits.push(`${tr("មជ្ឈមណ្ឌល៖")} ${centreName}`);
  if (f.provinceCode) bits.push(`${tr("ខេត្ត៖")} ${provinceName(f.provinceCode)}`);
  return bits.length ? bits.join(" · ") : tr("គ្មានការកំណត់ (ទិន្នន័យទាំងអស់)");
}
