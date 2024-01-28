import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)

  if (!session || !body?.typeEmployee) {
    return { status: "unauthenticated" };
  }
  // console.log(session)
  try {
    const totalCount =
      body.typeEmployee == "Contract"
        ? await event.context.prisma.staff.count()
        : await event.context.prisma.governStaff.count();

    const data =
      body.typeEmployee == "Contract"
        ? await event.context.prisma.staff.findMany({
            where: {
              //@ts-ignored
              serviceCenterID: session.serviceCenterID //@ts-ignore
                ? session.serviceCenterID
                : { not: null },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              gender: true,
              position: true,
              telephone: true,
              email: true,
              serviceCenterID: true,
              ServiceCenter: {
                select: {
                  id: true,
                  nameKH: true,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
            //@ts-ignore
            take: body?.limit ? parseInt(body?.limit) : 1000,
            //@ts-ignore
            skip: body?.skip ? parseInt(body?.skip) : 0,
          })
        : await event.context.prisma.governStaff.findMany({
            where: {
              //@ts-ignored
              serviceCenterID: session.serviceCenterID //@ts-ignore
                ? session.serviceCenterID
                : { not: null },
            },
            select: {
              firstNameKH: true,
              lastNameKH: true,
              gender: true,
              id: true,
              serviceCenterID: true,
              ServiceCenter: {
                select: {
                  id: true,
                  nameKH: true,
                },
              },
            },
            orderBy: {
              id: "desc",
            },
            //@ts-ignore
            take: body?.limit ? parseInt(body?.limit) : 1000,
            //@ts-ignore
            skip: body?.skip ? parseInt(body?.skip) : 0,
          });

    //@ts-ignore
    setResponseStatus(event, 201);
    return {
      data: data,
      total: totalCount,
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
