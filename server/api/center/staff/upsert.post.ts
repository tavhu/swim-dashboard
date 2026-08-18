import { getServerSession } from "#auth";

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
    await event.context.prisma.staff.upsert({
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
