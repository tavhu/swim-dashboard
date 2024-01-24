import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    // console.log(body);
    await event.context.prisma.governStaffQualifitcation.upsert({
      where: {
        id: body?.id,
      },
      update: {
        governStaffID: body?.governStaffID,
        couseLevel: body?.couseLevel,
        SchoolName: body?.SchoolName,
        SchoolLocation: body?.SchoolLocation,
        CertificateLevel: body?.CertificateLevel,
        majoring: body?.majoring,
        StartDate: body?.StartDate,
        finishDate: body?.finishDate,
      },
      create: {
        governStaffID: body?.governStaffID,
        couseLevel: body?.couseLevel,
        SchoolName: body?.SchoolName,
        SchoolLocation: body?.SchoolLocation,
        CertificateLevel: body?.CertificateLevel,
        majoring: body?.majoring,
        StartDate: body?.StartDate,
        finishDate: body?.finishDate,
      },
    });
    // console.log(res)
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "Update or Created" };
  } catch (e) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return {
      error: "e",
    };
  }
});
