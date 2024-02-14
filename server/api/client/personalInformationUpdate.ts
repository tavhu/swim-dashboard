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
    const result = await event.context.prisma.client_PersonalInformation.update(
      {
        where: {
          id: body?.id,
        },
        data: {
          fullNameKH: body?.fullNameKH,
          nickName: body?.nickName,
          ReadableCode: body?.ReadableCode,
          IdentifyCode: body?.IdentifyCode,
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
          commuteBA: body?.commuteBA,
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
          serviceCenterID: body?.serviceCenterID,
        },
      }
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
