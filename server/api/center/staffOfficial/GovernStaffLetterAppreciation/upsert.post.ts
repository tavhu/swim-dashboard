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
    await event.context.prisma.GovernStaffLetterAppreciation.upsert({
      where: {
        id: body?.id,
      },
      update: {
        governStaffID: body?.governStaffID,
        letterNumber: body?.letterNumber,
        OfficialDate: body?.OfficialDate,
        RequestedOrginsation: body?.RequestedOrginsation,
        LetterDetails: body?.LetterDetails,
        TypeReceived: body?.TypeReceived,
      },
      create: {
        governStaffID: body?.governStaffID,
        letterNumber: body?.letterNumber,
        OfficialDate: body?.OfficialDate,
        RequestedOrginsation: body?.RequestedOrginsation,
        LetterDetails: body?.LetterDetails,
        TypeReceived: body?.TypeReceived,
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
