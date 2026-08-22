import { getServerSession } from "#auth";
import { writeActivityLog } from "../../../utils/activityLog";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  console.log(body);

  if (!session) {
    return { status: "unauthenticated" };
  }

  // Staff belong to a centre, so a centre-bound user files them under their own
  // and nowhere else — the body does not get to say otherwise.
  const centreID = await resolveWriteCentre(event, body?.serviceCenterID);

  try {
    // Storage hygiene: on update, remove replaced files (photo + the three
    // attachment columns) after the row is written.
    const previous = body?.id
      ? await event.context.prisma.staff.findUnique({
          where: { id: body.id },
          select: {
            photo: true,
            attachedContract: true,
            attachedBackground: true,
            attachedFileInfomation: true,
          },
        })
      : null;

    const result = await event.context.prisma.staff.upsert({
      where: {
        id: body?.id,
      },
      update: {
        photo: body?.photo,
        fullnameEN: body?.fullnameEN,
        workingPeroidStart: body?.workingPeroidStart,
        workingContractAt: body?.workingContractAt,
        attachedContract: body?.attachedContract,
        attachedBackground: body?.attachedBackground,
        attachedFileInfomation: body?.attachedFileInfomation,
        firstName: body?.firstName,
        lastName: body?.lastName,
        nationality: body?.nationality,
        dateofbirth: body?.dateofbirth,
        birthAddress: body?.birthAddress,
        birthCity: body?.birthCity,
        birthDistrict: body?.birthDistrict,
        currentAddress: body?.currentAddress,
        currentQualification: body?.currentQualification,
        currentCity: body?.currentCity,
        currentDistrict: body?.currentDistrict,
        sID: body?.sID,
        passport: body?.passport,
        workingEXP: body?.workingEXP,
        workingEXPYes: body?.workingEXPYes,
        gender: body?.gender,
        position: body?.position,
        telephone: body?.telephone,
        familyAddress: body?.familyAddress,
        familyPhoneNumber: body?.familyPhoneNumber,
        familyEmail: body?.familyEmail,
        serviceCenterID: centreID,
      },
      create: {
        photo: body?.photo,
        fullnameEN: body?.fullnameEN,
        workingPeroidStart: body?.workingPeroidStart,
        workingContractAt: body?.workingContractAt,
        attachedContract: body?.attachedContract,
        attachedBackground: body?.attachedBackground,
        attachedFileInfomation: body?.attachedFileInfomation,
        firstName: body?.firstName,
        lastName: body?.lastName,
        nationality: body?.nationality,
        dateofbirth: body?.dateofbirth,
        birthAddress: body?.birthAddress,
        birthCity: body?.birthCity,
        birthDistrict: body?.birthDistrict,
        currentAddress: body?.currentAddress,
        currentQualification: body?.currentQualification,
        currentCity: body?.currentCity,
        currentDistrict: body?.currentDistrict,
        sID: body?.sID,
        passport: body?.passport,
        workingEXP: body?.workingEXP,
        workingEXPYes: body?.workingEXPYes,
        gender: body?.gender,
        position: body?.position,
        telephone: body?.telephone,
        familyAddress: body?.familyAddress,
        familyPhoneNumber: body?.familyPhoneNumber,
        familyEmail: body?.familyEmail,
        serviceCenterID: centreID,
      },
    });

    await writeActivityLog(event, {
      action: body?.id ? "UPDATE" : "CREATE",
      entityType: "STAFF",
      entityId: result.id,
      summary: `${body?.id ? "Updated" : "Created"} contract staff ${[body?.firstName, body?.lastName].filter(Boolean).join(" ") || body?.fullnameEN || ""}`.trim(),
      serviceCenterID: centreID,
    });

    if (previous) {
      const { cleanupReplacedFiles } = await import("../../../utils/storageCleanup");
      for (const f of ["photo", "attachedContract", "attachedBackground", "attachedFileInfomation"] as const) {
        await cleanupReplacedFiles(previous[f], body?.[f], "[staff/update]");
      }
    }
    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "Update or Created" };
  } catch (e: any) {
    console.log(e);
    //@ts-ignore
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
