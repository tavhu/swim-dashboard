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
    await event.context.prisma.governStaffLanuage.upsert({
      where: {
        id: body?.id,
      },
      update: {
        langName: body?.langName,
        read: body?.read,
        conversation: body?.conversation,
        writing: body?.writing,
        governStaffID: body?.governStaffID,
      },
      create: {
        langName: body?.langName,
        read: body?.read,
        conversation: body?.conversation,
        writing: body?.writing,
        governStaffID: body?.governStaffID,
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
