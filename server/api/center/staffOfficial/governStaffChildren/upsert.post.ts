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
    await event.context.prisma.governStaffChildren.upsert({
      where: {
        id: body?.id,
      },
      update: {
        fullnameKH: body?.fullnameKH,
        gender: body?.gender,
        dateofBirth: body?.dateofBirth,
        occupation: body?.occupation,
        governStaffID: body?.governStaffID,
      },
      create: {
        fullnameKH: body?.fullnameKH,
        gender: body?.gender,
        dateofBirth: body?.dateofBirth,
        occupation: body?.occupation,
        governStaffID: body?.governStaffID,
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
