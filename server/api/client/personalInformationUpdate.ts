import { getServerSession } from "#auth";
import { writeActivityLog } from "~~/server/utils/activityLog";

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
    return {
      error: `Missing or invalid: ${missing.join(", ")}`,
      fields: missing,
    };
  }

  // Two separate checks, and both are needed. The first says the caller may edit
  // *this* client; the second stops the edit itself from moving the client into
  // another centre, which would otherwise be a one-request way out of the scope.
  await assertClientScope(event, body?.id);
  const centreID = await resolveWriteCentre(event, body?.serviceCenterID);
  if (!centreID) {
    setResponseStatus(event, 400);
    return { error: errorMessage(event, "សូមជ្រើសរើសមជ្ឈមណ្ឌល") };
  }

  try {
    const result = await event.context.prisma.client_PersonalInformation.update(
      {
        where: {
          id: body?.id,
        },
        data: {
          fullNameKH: body?.fullNameKH,
          nickName: body?.nickName,
          // ReadableCode is issued once and is not editable, so it is never
          // taken from the body — a crafted request cannot change it either.
          photo: body?.photo,
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
        },
      },
    );

    //   console.log(body?.governStaffChildren);
    const ContextPrisma = event.context.prisma;

    const DeleteClientProgress = ContextPrisma.clientProgress.deleteMany({
      where: {
        Client_PersonalInformationID: body?.id,
      },
    });
    const CreateClientProgress = ContextPrisma.clientProgress.createMany({
      data: body?.ClientProgress,
    });

    const DeleteClientServeHistory =
      ContextPrisma.clientServeHistory.deleteMany({
        where: {
          Client_PersonalInformationID: body?.id,
        },
      });

    const CreateClientServeHistory =
      ContextPrisma.clientServeHistory.createMany({
        data: body?.ClientServeHistory,
      });

    const DeleteClientHopelessMultiple =
      ContextPrisma.clientHopelessMultiple.deleteMany({
        where: {
          client_PersonalInformationId: body?.id,
        },
      });
    const CreatClientHopelessMultiple =
      ContextPrisma.clientHopelessMultiple.createMany({
        data: body?.ClientHopelessMultiple,
      });

    const deleteed = await Promise.all([
      DeleteClientHopelessMultiple,
      DeleteClientProgress,
      DeleteClientServeHistory,
    ]);
    const createMany = await Promise.all([
      CreateClientProgress,
      CreatClientHopelessMultiple,
      CreateClientServeHistory,
    ]);

    //console.log(deleteed, createMany);

    await writeActivityLog(event, {
      action: "UPDATE",
      entityType: "CLIENT",
      entityId: result.id,
      summary: `Updated client ${result.ReadableCode ?? result.id}`,
      serviceCenterID: centreID,
    });

    setResponseStatus(event, 201);
    return { message: "User Update or Created", id: result.id };
  } catch (e: any) {
    // Was `error: "e"` — the literal string — so the form could only say
    // "unsuccessful" with no indication of which field was at fault.
    console.error("[client/update]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Could not save the client record" };
  }
});
