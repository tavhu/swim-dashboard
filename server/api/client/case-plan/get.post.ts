import { getServerSession } from "#auth";

/**
 * ទម្រង់ទី៣ — read case plans.
 *
 * `id` returns one plan with its activities and everything the view page needs
 * resolved; `clientId` returns that client's plans, newest first.
 *
 * The client select carries the manual's whole section ១: code, name, gender,
 * date of birth (age is derived, not stored — an age column would be wrong
 * within the year), family phone, and the four gazetteer codes the family
 * address resolves from. None of it is duplicated onto CasePlan.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);

  const include = {
    client: {
      // Named fields, never the whole client row.
      select: {
        id: true,
        ReadableCode: true,
        fullNameKH: true,
        Gender: true,
        DOB: true,
        FOCTel: true,
        MOCTel: true,
        // អាសយដ្ឋានគ្រួសារ — stored as gazetteer codes, resolved to Khmer names
        // client side by resolveAddress().
        cityProBA: true,
        districtBA: true,
        communeBA: true,
        villageBA: true,
        // Deliberately not the centre or the interviewer. Both are prefilled
        // onto the plan when it is created — from personalInformationGet, which
        // derives interviewerName rather than storing it — and are editable
        // afterwards, so the plan's own providerName and socialWorkerName are
        // the answer here. Reading them off the client again would show the
        // registering centre even when the plan names a different one.
      },
    },
    activities: {
      // The manual numbers these rows ១, ២, ៣ …, so their order is part of the
      // plan rather than whatever the database happens to return.
      orderBy: { sortOrder: "asc" as const },
      // The manual writes each activity as (លេខកូដ, ឈ្មោះសេវា ខ្មែរ, ឈ្មោះសេវា
      // អង់គ្លេស, បរិយាយ), but Service has no English name — part of the wider
      // bilingual gap, not something to bolt on here. Code and Khmer name are
      // what the printed plan can carry today.
      include: { service: { select: { code: true, nameKh: true } } },
    },
  };

  try {
    // Centre scope. ទម្រង់ទី២-៦ carry no centre of their own — they inherit the
    // one on the client they belong to — so the filter reaches through the
    // relation. Without it, any id in the request body was readable by anyone.
    const centre = await clientCentreFilter(event);

    if (body?.id) {
      const data = await event.context.prisma.casePlan.findFirst({
        where: { id: body.id, ...centre },
        include,
      });
      setResponseStatus(event, 200);
      return data;
    }

    if (body?.clientId) {
      const data = await event.context.prisma.casePlan.findMany({
        where: { clientId: body.clientId, ...centre },
        include,
        orderBy: { createdAt: "desc" },
      });
      setResponseStatus(event, 200);
      return { data, total: data.length };
    }

    setResponseStatus(event, 400);
    return { error: "id or clientId is required" };
  } catch (e: any) {
    console.error("[client/case-plan/get]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not read the case plan" };
  }
});
