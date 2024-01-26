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
    const result = await event.context.prisma.governStaff.upsert({
      where: {
        id: body?.id,
      },
      update: {
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
        // governStaffChildren: {
        //   update: {
        //     where: {
        //       id: body?.id,
        //     },
        //     data: {
        //       gender: "sdf",
        //     },
        //   },
        // },
      },
      create: {
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
        governStaffChildren: {
          createMany: {
            data: body?.governStaffChildren,
          },
        },
        // governStaffQualifitcation: {
        //   createMany: {
        //     data: body?.governStaffQualifitcation,
        //   },
        // },
        // governStaffLanuage: {
        //   createMany: {
        //     data: body?.governStaffLanuage,
        //   },
        // },
        // governStaffWorkingHistoryPublic: {
        //   createMany: {
        //     data: body?.governStaffWorkingHistoryPublic,
        //   },
        // },
        // governStaffWorkingHistoryPrivate: {
        //   createMany: {
        //     data: body?.governStaffWorkingHistoryPrivate,
        //   },
        // },
        // governStaffPositionHistory: {
        //   createMany: {
        //     data: body?.governStaffPositionHistory,
        //   },
        // },
        // governStaffCertificateLevelup: {
        //   createMany: {
        //     data: body?.governStaffCertificateLevelup,
        //   },
        // },
        // governStaffSituationOutsideOriginalOfficial: {
        //   createMany: {
        //     data: body?.governStaffSituationOutsideOriginalOfficial,
        //   },
        // },
        // governStaffFreeNoSalary: {
        //   createMany: {
        //     data: body?.governStaffFreeNoSalary,
        //   },
        // },
        // governStaffLetterAppreciation: {
        //   createMany: {
        //     data: body?.governStaffLetterAppreciation,
        //   },
        // },
        // governStaffFineHistory: {
        //   createMany: {
        //     data: body?.governStaffFineHistory,
        //   },
        // },
      },
    });

    // if (body?.governStaffChildren) {
    //   console.log(body?.governStaffChildren);
    //   const rrr = await Promise.allSettled(
    //     body?.governStaffChildren.map((item: governStaffChildren) => {
    //       event.context.prisma.governStaffChildren.upsert({
    //         where: { id: item.id ? item.id : "sa" },
    //         update: item,
    //         create: { ...item, governStaffID: result?.id },
    //       });
    //     })
    //   );
    //   console.log(rrr);
    // }

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
