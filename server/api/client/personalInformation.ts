import { getServerSession } from "#auth";

export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const rawBody = await readBody(event);
  // Prisma rejects '' for DateTime and Boolean columns, and the form
  // initialises every field to ''. See server/utils/clientPayload.ts.
  const { data: body, missing } = normaliseClientPayload(rawBody);
  if (missing.length) {
    setResponseStatus(event, 400);
    return { error: `Missing or invalid: ${missing.join(', ')}`, fields: missing };
  }

  // Which centre this client is filed under is not the form's decision when the
  // officer belongs to one. The dropdown offers only their own centre, but a
  // dropdown is not a permission check — the body can say anything.
  const centreID = await resolveWriteCentre(event, body?.serviceCenterID);
  if (!centreID) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "សូមជ្រើសរើសមជ្ឈមណ្ឌល") };
  }

  try {
    const result = await event.context.prisma.client_PersonalInformation.create(
      {
        data: {
          fullNameKH: body?.fullNameKH,
          nickName: body?.nickName,
          photo: body?.photo,
          // ReadableCode is omitted on purpose: the column default issues the
          // next C##### from a sequence. Accepting it from the body would let a
          // caller choose or collide with someone else's client number.
          Gender: body?.Gender,
          DOB: body?.DOB,
          POB: body?.POB,
          EducationLevel: body?.EducationLevel,
          Occupation: body?.Occupation,
          DateArrested: body?.DateArrested,
          homeBA: body?.homeBA,
          StreetBA: body?.StreetBA,
          villageBA: body?.villageBA,
          districtBA: body?.districtBA,
          communeBA: body?.communeBA,
          cityProBA: body?.cityProBA,
          FatherOrChaperoneName: body?.FatherOrChaperoneName,
          FOCDOB: body?.FOCDOB,
          FOCTel: body?.FOCTel,
          FOCMarried: body?.FOCMarried,
          FOCTelandAddress: body?.FOCTelandAddress,
          MotherOrChaperoneName: body?.MotherOrChaperoneName,
          MOCMarried: body?.MOCMarried,
          MOCDOB: body?.MOCDOB,
          MOCTel: body?.MOCTel,
          MOCTelandAddress: body?.MOCTelandAddress,
          OtherFamilyMembers: body?.OtherFamilyMembers,
          CloseFriend: body?.CloseFriend,
          ClientSendBy: body?.ClientSendBy,
          ImportantChallenge: body?.ImportantChallenge,
          PastActivities: body?.PastActivities,
          ReasonUseDrug: body?.ReasonUseDrug,
          ReasonUseDrugOther: body?.ReasonUseDrugOther,
          KnownLegalConsequence: body?.KnownLegalConsequence,
          typeDrugUsed: body?.typeDrugUsed,
          typeDrugUsedOther: body?.typeDrugUsedOther,
          DrugVolumeUsed: body?.DrugVolumeUsed,
          DrugRequecyUse: body?.DrugRequecyUse,
          DrugDurationUse: body?.DrugDurationUse,
          LivingSituation: body?.LivingSituation,
          UsedtoRehab: body?.UsedtoRehab,
          HowManyTimeHaveServed: body?.HowManyTimeHaveServed,
          ReasonComingtoCenter: body?.ReasonComingtoCenter,
          DailyActivitiesInCenter: body?.DailyActivitiesInCenter,
          ActivitiesThatClientLike: body?.ActivitiesThatClientLike,
          ClientTalent: body?.ClientTalent,
          RelationshipWithFriends: body?.RelationshipWithFriends,
          RelationshipWithStaff: body?.RelationshipWithStaff,
          RelationshipWithTeacher: body?.RelationshipWithTeacher,
          RelationshipWithOther: body?.RelationshipWithOther,
          ConcernForClientFuture: body?.ConcernForClientFuture,
          HopeForClientFuture: body?.HopeForClientFuture,
          FuturePlanforClient: body?.FuturePlanforClient,
          FuturePlanforClientDetails: body?.FuturePlanforClientDetails,
          ClientFeelsHopless: body?.ClientFeelsHopless,
          ClientHoplessDetails: body?.ClientHoplessDetails,
          InterviewerOpinoin: body?.InterviewerOpinoin,
          InterviewerID: body?.InterviewerID,
          status: body?.status,
          InterViewDate: body?.InterViewDate,
          InterViewerSignature: body?.InterViewerSignature,
          InterviewerPosition: body?.InterviewerPosition,
          serviceCenterID: centreID,

          ClientProgress: {
            createMany: {
              data: body?.ClientProgress,
            },
          },
          ClientServeHistory: {
            createMany: {
              data: body?.ClientServeHistory,
            },
          },
          ClientHopelessMultiple: {
            createMany: {
              data: body?.ClientHopelessMultiple,
            },
          },
        },
      }
    );

    //@ts-ignored
    setResponseStatus(event, 201);
    return { message: "User Update or Created", id: result.id, ReadableCode: result.ReadableCode };
  } catch (e: any) {
    // Was `error: "e"` — the literal string — so the form could only say
    // "unsuccessful" with no indication of which field was at fault.
    console.error("[client/create]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the client record" };
  }
});
