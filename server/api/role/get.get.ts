import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  // const body =  await readBody(event)
  const body = getQuery(event);

  if (!session) {
    return {
      status: "unauthenticated",
      data: [],
      total: 0,
      error: "e",
    };
  }

  try {
    const totalCount = await event.context.prisma.role.count();
    let data = await event.context.prisma.role.findMany({
      orderBy: {
        id: "desc",
      },
      //@ts-ignore
      take: body?.limit ? parseInt(body?.limit) : 1000,
      //@ts-ignore
      skip: body?.skip ? parseInt(body?.skip) : 0,
    });

    let userID: any = body?.userID;
    const user = await event.context.prisma.user.findUnique({
      where: {
        id: userID ? userID : "",
      },
    });

    const roleResource = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: user?.userRoleID ? user?.userRoleID : "",
        granted: false,
      },
      select: {
        granted: true,
        read: true,
        Resource: true,
        role: true,
      },
    });

    let tem = data;
    //get all roleandresource that was not granted permission and not allow to read
    //Resource.frontEndURL contain role id
    tem = data.filter((item) => {
      let superAdmin = roleResource.find((ele) => {
        // console.log(ele)
        return (
          (ele.Resource.frontEndURL === item.id && !ele.granted && !ele.read) ||
          (ele.Resource.frontEndURL === item.id && !ele.granted && ele.read)
        );
      });
      return item.id === superAdmin?.Resource.frontEndURL && superAdmin;
    });

    //filter out all role that was not allow
    let temData = data;
    temData = data.filter((ss) => {
      return !tem.find((element) => {
        return ss.id == element.id;
      });
    });

    //@ts-ignore
    setResponseStatus(event, 201);
    return {
      data: body?.userID ? temData : data,
      total: totalCount,
      error: "",
      status: "authenticated",
    };
  } catch (e) {
    //@ts-ignore
    setResponseStatus(event, 412);
    return {
      data: [],
      total: 0,
      error: "e",
      status: "authenticated",
    };
  }
});
