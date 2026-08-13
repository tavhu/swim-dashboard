import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  // spouseDateOfBirth is optional but the form sends '' — Prisma rejects
  // that for a DateTime column. See server/utils/payload.ts.
  const { data: body, missing } = normaliseGovernStaffPayload(rawBody);
  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(', ')}`, fields: missing };
  }
  try {
    const result = await event.context.prisma.governStaff.update({
      where: {
        id: body?.id,
      },
      data: {
        photo: body?.photo,
        firstNameKH: body?.firstNameKH,
        lastNameKH: body?.lastNameKH,
        firstNameEN: body?.firstNameEN,
        lastNameEN: body?.lastNameEN,
        gender: body?.gender,
        DateofBirth: body?.DateofBirth,
        ethnicity: body?.ethnicity,
        nationality: body?.nationality,
        birthAddress: body?.birthAddress,
        birthCity: body?.birthCity,
        birthDistrict: body?.birthDistrict,
        birthCommune: body?.birthCommune,
        birthVillage: body?.birthVillage,
        currentAddress: body?.currentAddress,
        currentCity: body?.currentCity,
        currentDistrict: body?.currentDistrict,
        currentCommune: body?.currentCommune,
        currentVillage: body?.currentVillage,
        permanentAddress: body?.permanentAddress,
        permanentCity: body?.permanentCity,
        permanentDistrict: body?.permanentDistrict,
        permanentCommune: body?.permanentCommune,
        permanentVillage: body?.permanentVillage,
        telephone: body?.telephone,
        email: body?.email,
        officialID: body?.officialID,
        CambodianSocialID: body?.CambodianSocialID,
        sIDValidStart: body?.sIDValidStart,
        sIDValidEnd: body?.sIDValidEnd,
        physical: body?.physical,
        familyInfo: body?.familyInfo,
        spouseNameKH: body?.spouseNameKH,
        spuseNameEN: body?.spuseNameEN,
        spouseDateOfBirth: body?.spouseDateOfBirth,
        spouseSID: body?.spouseSID,
        spouseBirthAddress: body?.spouseBirthAddress,
        spouseBirthCity: body?.spouseBirthCity,
        spouseBirthDistrict: body?.spouseBirthDistrict,
        spouseBirthCommune: body?.spouseBirthCommune,
        spouseBirthVillage: body?.spouseBirthVillage,
        spouseCurrentOccupation: body?.spouseCurrentOccupation,
        spouseOrganisationName: body?.spouseOrganisationName,
        spuseCurrentAddress: body?.spuseCurrentAddress,
        fatherFullNameKH: body?.fatherFullNameKH,
        fatherOccupation: body?.fatherOccupation,
        fatherBirthAddress: body?.fatherBirthAddress,
        fatherBirthAddressCity: body?.fatherBirthAddressCity,
        fatherBirthAddressDistrict: body?.fatherBirthAddressDistrict,
        fatherBirthAddressCommune: body?.fatherBirthAddressCommune,
        fatherBirthAddressVillage: body?.fatherBirthAddressVillage,
        motherOcupation: body?.motherOcupation,
        motherFullNameKH: body?.motherFullNameKH,
        motherBirthAddress: body?.motherBirthAddress,
        motherBirthAddressCity: body?.motherBirthAddressCity,
        motherBirthAddressDistrict: body?.motherBirthAddressDistrict,
        motherBirthAddressCommune: body?.motherBirthAddressCommune,
        motherBirthAddressVillage: body?.motherBirthAddressVillage,
        ECFirstNameKH: body?.ECFirstNameKH,
        ECLastNameKH: body?.ECLastNameKH,
        ECGender: body?.ECGender,
        ECRelationshipAs: body?.ECRelationshipAs,
        ECOccupation: body?.ECOccupation,
        ECAddress: body?.ECAddress,
        ECAddressCity: body?.ECAddressCity,
        ECAddressDistrict: body?.ECAddressDistrict,
        ECAddressCommune: body?.ECAddressCommune,
        ECAddressVillage: body?.ECAddressVillage,
        ECTelehpone: body?.ECTelehpone,
        DateStartOfficialWork: body?.DateStartOfficialWork,
        DateWentFullTime: body?.DateWentFullTime,
        CurrentRank: body?.CurrentRank,
        OfficialLevelKH: body?.OfficialLevelKH,
        serviceCenterID: body?.serviceCenterID,
      },
    });

    //   console.log(body?.governStaffChildren);
    const ContextPrisma = event.context.prisma;

    const deleteGovernStaffChildren =
      ContextPrisma.governStaffChildren.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffChildren = ContextPrisma.governStaffChildren.createMany({
      data: body?.governStaffChildren,
    });

    const deletegovernStaffQualifitcation =
      ContextPrisma.governStaffQualifitcation.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });

    const governStaffQualifitcation =
      ContextPrisma.governStaffQualifitcation.createMany({
        data: body?.governStaffQualifitcation,
      });

    const deletegovernStaffLanuage =
      ContextPrisma.governStaffLanuage.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffLanuage = ContextPrisma.governStaffLanuage.createMany({
      data: body?.governStaffLanuage,
    });

    const deletegovernStaffWorkingHistoryPublic =
      ContextPrisma.governStaffWorkingHistoryPublic.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffWorkingHistoryPublic =
      ContextPrisma.governStaffWorkingHistoryPublic.createMany({
        data: body?.governStaffWorkingHistoryPublic,
      });

    const deletegovernStaffPositionHistory =
      ContextPrisma.governStaffPositionHistory.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffPositionHistory =
      ContextPrisma.governStaffPositionHistory.createMany({
        data: body?.governStaffPositionHistory,
      });

    const deletegovernStaffCertificateLevelup =
      ContextPrisma.governStaffCertificateLevelup.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffCertificateLevelup =
      ContextPrisma.governStaffCertificateLevelup.createMany({
        data: body?.governStaffCertificateLevelup,
      });

    const deletegovernStaffSituationOutsideOriginalOfficial =
      ContextPrisma.governStaffSituationOutsideOriginalOfficial.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffSituationOutsideOriginalOfficial =
      ContextPrisma.governStaffSituationOutsideOriginalOfficial.createMany({
        data: body?.governStaffSituationOutsideOriginalOfficial,
      });

    const deletegovernStaffFreeNoSalary =
      ContextPrisma.governStaffFreeNoSalary.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffFreeNoSalary =
      ContextPrisma.governStaffFreeNoSalary.createMany({
        data: body?.governStaffFreeNoSalary,
      });

    const deletegovernStaffLetterAppreciation =
      ContextPrisma.governStaffLetterAppreciation.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffLetterAppreciation =
      ContextPrisma.governStaffLetterAppreciation.createMany({
        data: body?.governStaffLetterAppreciation,
      });

    const deletegovernStaffFineHistory =
      ContextPrisma.governStaffFineHistory.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffFineHistory =
      ContextPrisma.governStaffFineHistory.createMany({
        data: body?.governStaffFineHistory,
      });
    const deletegovernStaffWorkingHistoryPrivate =
      ContextPrisma.governStaffWorkingHistoryPrivate.deleteMany({
        where: {
          governStaffID: body?.id,
        },
      });
    const governStaffWorkingHistoryPrivate =
      ContextPrisma.governStaffWorkingHistoryPrivate.createMany({
        data: body?.governStaffWorkingHistoryPrivate,
      });

    const deleteed = await Promise.all([
      deleteGovernStaffChildren,
      deletegovernStaffQualifitcation,
      deletegovernStaffLanuage,
      deletegovernStaffWorkingHistoryPublic,
      deletegovernStaffPositionHistory,
      deletegovernStaffCertificateLevelup,
      deletegovernStaffSituationOutsideOriginalOfficial,
      deletegovernStaffFreeNoSalary,
      deletegovernStaffLetterAppreciation,
      deletegovernStaffFineHistory,
      deletegovernStaffWorkingHistoryPrivate,
    ]);
    const createMany = await Promise.all([
      governStaffChildren,
      governStaffQualifitcation,
      governStaffLanuage,
      governStaffWorkingHistoryPublic,
      governStaffPositionHistory,
      governStaffCertificateLevelup,
      governStaffSituationOutsideOriginalOfficial,
      governStaffFreeNoSalary,
      governStaffLetterAppreciation,
      governStaffFineHistory,
      governStaffWorkingHistoryPrivate,
    ]);

    //console.log(deleteed, createMany);

    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "User Update or Created", id: result.id };
  } catch (e: any) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
