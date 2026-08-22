import { getServerSession } from "#auth";
import { writeActivityLog } from "../../utils/activityLog";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

  // A centre-bound user may edit their own centre's details and no other's.
  // They may not create one either: `upsert` writes a new row when the id does
  // not match, so without this a centre officer could add centres at will.
  const caller = await getAuthUser(event);
  if (caller?.serviceCenterID && caller.serviceCenterID !== body?.id) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ") };
  }

  // An id that names an existing row is an update; anything else creates.
  const existing = body?.id
    ? await event.context.prisma.serviceCenter.findUnique({
        where: { id: body.id },
        select: { id: true },
      })
    : null;
  const isUpdate = !!existing;

  try {
    await event.context.prisma.serviceCenter.upsert({
      where: {
        id: body?.id,
      },
      update: {
        nameKH: body?.nameKH,
        nameEN: body?.nameEN,
        type: body?.type,
        logo: body?.logo,
        directorName: body?.directorName,
        phoneNumber: body?.phoneNumber,
        PoBox: body?.PoBox,
        email: body?.email,
        website: body?.website,
        locationMap: body?.locationMap,
        Address: body?.Address,
        City: body?.City,
        District: body?.District,
        Commute: body?.Commute,
        Village: body?.Village,
        overview: body?.overview,
        background: body?.background,
        mission: body?.mission,
        vision: body?.vision,
        goal: body?.goal,
        ProjectSummary: body?.ProjectSummary,
        status: body?.status,
        organisationID: body?.organisationID,
      },
      create: {
        nameKH: body?.nameKH,
        nameEN: body?.nameEN,
        logo: body?.logo,
        type: body?.type,
        directorName: body?.directorName,
        phoneNumber: body?.phoneNumber,
        PoBox: body?.PoBox,
        email: body?.email,
        website: body?.website,
        locationMap: body?.locationMap,
        Address: body?.Address,
        City: body?.City,
        District: body?.District,
        Commute: body?.Commute,
        Village: body?.Village,
        overview: body?.overview,
        background: body?.background,
        mission: body?.mission,
        vision: body?.vision,
        goal: body?.goal,
        ProjectSummary: body?.ProjectSummary,
        status: body?.status,
        organisationID: body?.organisationID,
      },
    });

    await writeActivityLog(event, {
      action: isUpdate ? "UPDATE" : "CREATE",
      entityType: "CENTER",
      entityId: body?.id ?? null,
      summary: `${isUpdate ? "Updated" : "Created"} centre ${body?.nameKH || body?.nameEN || ""}`.trim(),
    });
    // console.log(res)
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "User Update or Created" };
  } catch (e: any) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
