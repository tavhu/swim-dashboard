import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

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
        overview: body?.overview,
        background: body?.background,
        mission: body?.mission,
        vision: body?.vision,
        goal: body?.goal,
        ProjectSummary: body?.ProjectSummary,
        status: body?.status,
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
        overview: body?.overview,
        background: body?.background,
        mission: body?.mission,
        vision: body?.vision,
        goal: body?.goal,
        ProjectSummary: body?.ProjectSummary,
        status: body?.status,
      },
    });
    // console.log(res)
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "User Update or Created" };
  } catch (e) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return {
      error: "e",
    };
  }
});
