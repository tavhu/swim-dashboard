import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }

  // Deleting a centre is a ministry-level act. A user attached to one has no
  // business removing any centre — least of all their own, which would orphan
  // every client filed under it.
  const caller = await getAuthUser(event);
  if (caller?.serviceCenterID) {
    setResponseStatus(event, 403);
    return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលុបមជ្ឈមណ្ឌលទេ") };
  }

  try {
    await event.context.prisma.serviceCenter.delete({
      where: {
        id: body?.id,
      },
    });
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "delete success" };
  } catch (e: any) {
    //@ts-ignored
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Request failed" };
  }
});
