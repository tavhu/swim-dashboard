import { getServerSession } from "#auth";

/**
 * Delete one staff member — contract staff live in `Staff`, civil servants in
 * `governStaff`.
 *
 * Two faults, both silent.
 *
 * The delete was never awaited: the ternary produced a `PrismaPromise` and threw
 * it away. A PrismaPromise is lazy — it does not issue a query until it is
 * awaited — so the endpoint returned "delete success" without deleting anything,
 * and the row came back on the next refresh.
 *
 * And it had no centre scope, so a user attached to one centre could remove
 * another centre's staff by id.
 */
export default eventHandler(async (event) => {
  const session = await getServerSession(event);
  const body = await readBody(event);

  if (!session) {
    return { status: "unauthenticated" };
  }

  const id: unknown = body?.id;
  if (typeof id !== "string" || id.length === 0) {
    setResponseStatus(event, 400);
    return { error: "id is required" };
  }

  const isContract = body?.typeEmployee === "Contract";
  // Only `governStaff` capitalises the relation; `Staff` names it serviceCenter.
  const delegate = isContract
    ? event.context.prisma.staff
    : event.context.prisma.governStaff;

  try {
    const record = await delegate.findUnique({
      where: { id },
      select: { id: true, serviceCenterID: true },
    });
    if (!record) {
      setResponseStatus(event, 404);
      return { error: errorMessage(event, "រកមិនឃើញបុគ្គលិកនេះទេ") };
    }

    const caller = await getAuthUser(event);
    if (caller?.serviceCenterID && caller.serviceCenterID !== record.serviceCenterID) {
      setResponseStatus(event, 403);
      return { error: errorMessage(event, "អ្នកមិនមានសិទ្ធិលើមជ្ឈមណ្ឌលនេះទេ") };
    }

    await delegate.delete({ where: { id } });

    setResponseStatus(event, 201);
    return { message: "delete success" };
  } catch (e: any) {
    console.error("[center/staff/delete]", e);
    setResponseStatus(event, 502);
    return { error: e?.message ?? "Request failed" };
  }
});
