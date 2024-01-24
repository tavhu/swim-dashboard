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
    await event.context.prisma.governStaffPositionHistory.upsert({
      where: {
        id: body?.id,
      },
      update: {
        ValidDate: body?.ValidDate,
        governStaffID: body?.governStaffID,
        MinistryName: body?.MinistryName,
        Department: body?.Department,
        OfficialSection: body?.OfficialSection,
        oldOfficialLevel: body?.oldOfficialLevel,
        newOffcialLevel: body?.newOffcialLevel,
        changeTo: body?.changeTo,
      },
      create: {
        ValidDate: body?.ValidDate,
        governStaffID: body?.governStaffID,
        MinistryName: body?.MinistryName,
        Department: body?.Department,
        OfficialSection: body?.OfficialSection,
        oldOfficialLevel: body?.oldOfficialLevel,
        newOffcialLevel: body?.newOffcialLevel,
        changeTo: body?.changeTo,
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
