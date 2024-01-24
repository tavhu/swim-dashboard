import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    await event.context.prisma.staff.delete({
      where: {
        id: body?.id,
      },
    });
    //@ts-ignore
    setResponseStatus(event, 201);
    return { message: "delete success" };
  } catch (e) {
    //@ts-ignore
    setResponseStatus(event, 502);
    return {
      error: "e",
    };
  }
});
