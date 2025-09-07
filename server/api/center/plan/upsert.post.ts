import { getServerSession } from "#auth";
import { URL } from "url";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session || !session.user) {
    setResponseStatus(event, 401);
    return { status: "unauthenticated" };
  }

  const user = session.user as any;
  const body = await readBody(event);

  try {
    const resource = await event.context.prisma.resources.findFirst({
      where: { frontEndURL: "center-plan" },
    });

    if (!resource) {
      setResponseStatus(event, 404);
      return { error: "Resource 'center-plan' not found." };
    }
    console.log("[API Info] Resource found:", {
      resourceID: resource.id,
      resourceName: resource.name,
    });

    const permission = await event.context.prisma.roleToResource.findFirst({
      where: {
        roleID: user.roleID,
        resourceID: resource.id,
      },
    });

    // If no permission record exists, or granted is explicitly false, deny action.
    if (!permission || !permission.granted) {
      setResponseStatus(event, 403);
      return {
        error: "Forbidden. You do not have permission to perform this action.",
      };
    }
    console.log("[API Info] 'Create' permission granted.", { permission });

    // Security Check: If the user is not a full admin and is assigned to a center,
    // they can only upload to their own center.
    if (
      permission.granted === false &&
      user.serviceCenterID &&
      user.serviceCenterID !== body.serviceCenterID
    ) {
      setResponseStatus(event, 403);
      return {
        error:
          "Forbidden. You do not have permission to upload to this service center.",
      };
    }

    const planData = {
      actvityPlan: body.actvityPlan,
      note: body.note,
      yearPlan: body.yearPlan,
      filePath: body.filePath,
      serviceCenterID: body.serviceCenterID,
    };

    console.log("[API Info] Creating CenterPlan with data:", planData);
    const upsertedPlan = await event.context.prisma.centerPlan.create({
      data: planData,
    });

    console.log(
      "[API Info] Successfully created plan with ID:",
      upsertedPlan.id
    );
    console.log("--- [API] End /api/center/plan/upsert ---");
    return { status: "success", data: upsertedPlan };
  } catch (e) {
    console.error(
      "[API Critical Error] An unexpected error occurred in the try-catch block:",
      e
    );
    setResponseStatus(event, 500);
    return {
      error: "An error occurred while creating or updating the plan.",
    };
  }
});
