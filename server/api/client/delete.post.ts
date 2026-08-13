import { getServerSession } from "#auth";

/**
 * Deletes a client record and everything hanging off it.
 *
 * This endpoint did not exist. `pages/client/index.vue` wired its delete button
 * to `/api/center/delete`, which calls `prisma.serviceCenter.delete()` — so it
 * looked up a client id in the service-centre table, found nothing, and failed.
 * Deleting a client from the UI has never worked.
 *
 * The children cannot be left to the database: ClientProgress,
 * ClientServeHistory and ServicesOnClients are all ON DELETE RESTRICT, so a
 * plain delete fails for any client with history — which is every client that
 * has been worked on. ClientHopelessMultiple is SET NULL and would be left as
 * orphan rows. Everything goes in one transaction so a partial delete cannot
 * survive a failure halfway through.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  if (!session) {
    return { status: "unauthenticated" };
  }

  const body = await readBody(event);
  const id: unknown = body?.id;

  if (typeof id !== "string" || id.length === 0) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const prisma = event.context.prisma;

  try {
    const existing = await prisma.client_PersonalInformation.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      setResponseStatus(event, 404);
      return { error: "No client with that id" };
    }

    await prisma.$transaction([
      prisma.clientProgress.deleteMany({ where: { Client_PersonalInformationID: id } }),
      prisma.clientServeHistory.deleteMany({ where: { Client_PersonalInformationID: id } }),
      prisma.servicesOnClients.deleteMany({ where: { clientId: id } }),
      prisma.clientHopelessMultiple.deleteMany({ where: { client_PersonalInformationId: id } }),
      prisma.client_PersonalInformation.delete({ where: { id } }),
    ]);

    setResponseStatus(event, 200);
    return { message: "delete success", id };
  } catch (e: any) {
    console.error("[client/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Could not delete the client record" };
  }
});
