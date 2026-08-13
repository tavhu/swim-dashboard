import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session) {
    return { status: "unauthenticated" };
  }
  console.log(body);

  try {
    const totalCount =
      await event.context.prisma.client_PersonalInformation.count();
    const data = body?.id
      ? await event.context.prisma.client_PersonalInformation.findFirst({
          where: {
            id: body?.id,
          },
          include: {
            ClientProgress: {
              where: {
                Client_PersonalInformationID: body?.id,
              },
            },
            ClientServeHistory: {
              where: {
                Client_PersonalInformationID: body?.id,
              },
            },
            ClientHopelessMultiple: {
              where: {
                client_PersonalInformationId: body?.id,
              },
            },
          },
        })
      : await event.context.prisma.client_PersonalInformation.findMany({
          where: {
            //@ts-ignored
            id: session.serviceCenterID
              ? //@ts-ignored
                session.serviceCenterID
              : { not: "null" },
          },
          orderBy: {
            id: "desc",
          },
          //@ts-ignore
          take: body?.limit ? parseInt(body?.limit) : 1000,
          //@ts-ignore
          skip: body?.skip ? parseInt(body?.skip) : 0,
        });
    // InterviewerID is a plain column rather than a relation, so the officer's
    // name needs its own lookup. Only the name is selected — /api/user/checkUsername
    // once returned whole User rows including the bcrypt hash (see SECURITY.md).
    if (body?.id && data && (data as any).InterviewerID) {
      const interviewer = await event.context.prisma.user.findUnique({
        where: { id: (data as any).InterviewerID },
        select: { firstname: true, lastname: true },
      });
      (data as any).interviewerName = interviewer
        ? [interviewer.firstname, interviewer.lastname].filter(Boolean).join(" ")
        : null;
    }

    //@ts-ignored
    setResponseStatus(event, 201);
    return body?.id
      ? data
      : { data: data, total: totalCount, error: "", status: "authenticated" };
  } catch (e) {
    //@ts-ignored
    setResponseStatus(event, 412);
    return {
      error: e,
    };
  }
});
