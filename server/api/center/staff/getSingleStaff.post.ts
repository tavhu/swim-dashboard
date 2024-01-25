import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session || !body.id || !body?.typeEmployee) {
    return { status: "unauthenticated" };
  }

  // console.log(session)
  try {
    const data =
      body?.typeEmployee == "Contract"
        ? await event.context.prisma.staff.findFirst({
            where: {
              id: body?.id,
            },
          })
        : await event.context.prisma.governStaff.findFirst({
            where: {
              id: body?.id,
            },
          });

    //@ts-ignore
    setResponseStatus(event, 201);
    return {
      data: data,
      error: "",
      status: "authenticated",
    };
  } catch (e) {
    //@ts-ignored
    setResponseStatus(event, 412);
    return {
      error: e,
    };
  }
});
