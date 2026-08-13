import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    const data = await event.context.prisma.roleToResource.findMany({});

    // console.log(data)
    //@ts-ignored
    setResponseStatus(event, 201);
    return { data: data };
  } catch (e: any) {
    //@ts-ignored
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
