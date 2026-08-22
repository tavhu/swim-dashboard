import { getServerSession } from "#auth";
import { writeActivityLog } from "../../../utils/activityLog";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  // spouseDateOfBirth is optional but the form sends '' — Prisma rejects
  // that for a DateTime column. See server/utils/payload.ts.
  const { data: body, missing } = normaliseGovernStaffPayload(rawBody);

  // Repeatable rows: blank rows dropped, half-filled rows named back instead of
  // failing at Prisma with an internal error.
  const rowLists = normaliseGovernStaffRows(rawBody);
  missing.push(...rowLists.missing);

  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(', ')}`, fields: missing };
  }

  // បុគ្គលិករដ្ឋ belong to a centre, so a centre-bound user files them under
  // their own and nowhere else — the body does not get to say otherwise. The
  // contract-staff endpoint has done this since the centre scoping went in;
  // this one was taking serviceCenterID straight from the request.
  const centreID = await resolveWriteCentre(event, body?.serviceCenterID);


  try {
    const result = await event.context.prisma.governStaff.create({
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
        spuseCurrentAddressCity: body?.spuseCurrentAddressCity,
        spuseCurrentAddressDistrict: body?.spuseCurrentAddressDistrict,
        spuseCurrentAddressCommune: body?.spuseCurrentAddressCommune,
        spuseCurrentAddressVillage: body?.spuseCurrentAddressVillage,
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
        ECAddressDistrict: body?.ECAddressDistrict,
        ECAddressCommune: body?.ECAddressCommune,
        ECAddressVillage: body?.ECAddressVillage,
        ECTelehpone: body?.ECTelehpone,
        DateStartOfficialWork: body?.DateStartOfficialWork,
        DateWentFullTime: body?.DateWentFullTime,
        CurrentRank: body?.CurrentRank,
        OfficialLevelKH: body?.OfficialLevelKH,
        serviceCenterID: centreID,
        governStaffChildren: {
          createMany: {
            data: rowLists.lists.governStaffChildren ?? [],
          },
        },
        governStaffQualifitcation: {
          createMany: {
            data: rowLists.lists.governStaffQualifitcation ?? [],
          },
        },
        governStaffLanuage: {
          createMany: {
            data: rowLists.lists.governStaffLanuage ?? [],
          },
        },
        governStaffWorkingHistoryPublic: {
          createMany: {
            data: rowLists.lists.governStaffWorkingHistoryPublic ?? [],
          },
        },
        governStaffWorkingHistoryPrivate: {
          createMany: {
            data: rowLists.lists.governStaffWorkingHistoryPrivate ?? [],
          },
        },
        governStaffPositionHistory: {
          createMany: {
            data: rowLists.lists.governStaffPositionHistory ?? [],
          },
        },
        governStaffCertificateLevelup: {
          createMany: {
            data: rowLists.lists.governStaffCertificateLevelup ?? [],
          },
        },
        governStaffSituationOutsideOriginalOfficial: {
          createMany: {
            data: rowLists.lists.governStaffSituationOutsideOriginalOfficial ?? [],
          },
        },
        governStaffFreeNoSalary: {
          createMany: {
            data: rowLists.lists.governStaffFreeNoSalary ?? [],
          },
        },
        governStaffLetterAppreciation: {
          createMany: {
            data: rowLists.lists.governStaffLetterAppreciation ?? [],
          },
        },
        governStaffFineHistory: {
          createMany: {
            data: rowLists.lists.governStaffFineHistory ?? [],
          },
        },
      },
    });

    //@ts-ignored
    setResponseStatus(event, 201);

    await writeActivityLog(event, {
      action: "CREATE",
      entityType: "GOVERN_STAFF",
      entityId: result.id,
      summary: `Created civil-servant staff ${[body?.firstNameKH, body?.lastNameKH].filter(Boolean).join(" ") || body?.firstNameEN || ""}`.trim(),
      serviceCenterID: centreID,
    });

    return { message: "User Update or Created", id: result.id };
  } catch (e: any) {
    console.log(e);
    //@ts-ignored
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
