export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  const body = getQuery(event);

  // Whether to filter the list down to the roles this caller may assign. The
  // *which user* is no longer taken from `?userID=` — that let anyone read
  // anyone else's assignable roles — only whether to filter at all.
  const scopeToCaller = !!body?.userID;

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

    const roleResource = await event.context.prisma.roleToResource.findMany({
      where: {
        roleID: caller.roleId ?? "",
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
      data: scopeToCaller ? temData : data,
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
