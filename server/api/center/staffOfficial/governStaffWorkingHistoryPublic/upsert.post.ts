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
    await event.context.prisma.governStaffWorkingHistoryPublic.upsert({
      where: {
        id: body?.id,
      },
      update: {
        governStaffID: body?.governStaffID,
        DateStartWorking: body?.DateStartWorking,
        DateStopWorking: body?.DateStopWorking,
        OgnisationName: body?.OgnisationName,
        Department: body?.Department,
        position: body?.position,
        SkillInPosition: body?.SkillInPosition,
      },
      create: {
        governStaffID: body?.governStaffID,
        DateStartWorking: body?.DateStartWorking,
        DateStopWorking: body?.DateStopWorking,
        OgnisationName: body?.OgnisationName,
        Department: body?.Department,
        position: body?.position,
        SkillInPosition: body?.SkillInPosition,
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
