import { getServerSession } from "#auth";
import { where } from "firebase/firestore";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  console.log(body);

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    await event.context.prisma.centerPlan.upsert({
      where: {
        id: body?.id,
      },
      update: {
        actvityPlan: body?.actvityPlan,
        note: body?.note,
        yearPlan: body?.yearPlan,
        filePath: body?.filePath,
        serviceCenterID: body?.serviceCenterID,
      },
      create: {
        actvityPlan: body?.actvityPlan,
        note: body?.note,
        yearPlan: body?.yearPlan,
        filePath: body?.filePath,
        serviceCenterID: body?.serviceCenterID,
      },
    });
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "Update or Created" };
  } catch (e) {
    console.log(e);
    //@ts-ignore
    setResponseStatus(event, 412);
    return {
      error: "e",
    };
  }
});
