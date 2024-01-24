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
    await event.context.prisma.governStaffFreeNoSalary.upsert({
      where: {
        id: body?.id,
      },
      update: {
        governStaffID: body?.governStaffID,
        startDate: body?.startDate,
        endDate: body?.endDate,
        Oginisationname: body?.Oginisationname,
        NumberofMonthandYear: body?.NumberofMonthandYear,
      },
      create: {
        governStaffID: body?.governStaffID,
        startDate: body?.startDate,
        endDate: body?.endDate,
        Oginisationname: body?.Oginisationname,
        NumberofMonthandYear: body?.NumberofMonthandYear,
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
