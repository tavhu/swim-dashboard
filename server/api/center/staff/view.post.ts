import { getServerSession } from "#auth";

/**
 * Single staff record for the read view — the /api/client/service/get pattern:
 * the record itself at the top level, no wrapper object, so the view page can
 * check `data.id` exactly like every other មើល page in the app.
 *
 * getSingleStaff.post.ts (the older endpoint) wraps its payload in
 * { data, error, status }; that shape forced the view page into special-case
 * unwrapping, which is what broke it. This endpoint exists so the staff view
 * follows the same contract as the rest of the system.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session || !body?.id || !body?.typeEmployee) {
    throw createError({ statusCode: 401, statusMessage: "unauthenticated" });
  }

  try {
    const record =
      body.typeEmployee === "Contract"
        ? await event.context.prisma.staff.findFirst({
            where: { id: body.id },
          })
        : await event.context.prisma.governStaff.findFirst({
            where: { id: body.id },
            include: {
              governStaffChildren: true,
              governStaffQualifitcation: true,
              governStaffLanuage: true,
              governStaffWorkingHistoryPublic: true,
              governStaffPositionHistory: true,
              governStaffCertificateLevelup: true,
              governStaffSituationOutsideOriginalOfficial: true,
              governStaffFreeNoSalary: true,
              governStaffLetterAppreciation: true,
              governStaffFineHistory: true,
              governStaffWorkingHistoryPrivate: true,
            },
          });

    if (!record) {
      throw createError({ statusCode: 404, statusMessage: "record not found" });
    }

    return record;
  } catch (e: any) {
    if (e?.statusCode === 404) throw e;
    throw createError({
      statusCode: e?.statusCode ?? 500,
      statusMessage: e?.statusMessage ?? "load failed",
    });
  }
});
