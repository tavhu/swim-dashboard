import { getServerSession } from "#auth";
import { governStaffChildren } from "@prisma/client";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  // console.log(body)
  if (!session) {
    return { status: "unauthenticated" };
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
        currentAddress: body?.currentAddress,
        permanentAddress: body?.permanentAddress,
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
        spouseCurrentOccupation: body?.spouseCurrentOccupation,
        spouseOrganisationName: body?.spouseOrganisationName,
        spuseCurrentAddress: body?.spuseCurrentAddress,
        fatherFullNameKH: body?.fatherFullNameKH,
        FatherOccupation: body?.FatherOccupation,
        fatherBrithAddress: body?.fatherBrithAddress,
        MotherOcupation: body?.MotherOcupation,
        motherFullNameKH: body?.motherFullNameKH,
        motherBrirthAddress: body?.motherBrirthAddress,
        ECFirstNameKH: body?.ECFirstNameKH,
        ECLastNameKH: body?.ECLastNameKH,
        ECGender: body?.ECGender,
        ECRelationshipAs: body?.ECRelationshipAs,
        ECOccupation: body?.ECOccupation,
        ECAddress: body?.ECAddress,
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
  } catch (e) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return {
      error: "e",
    };
  }
});
