import type { H3Event } from "h3";

/**
 * Centre scoping for client records.
 *
 * A user with a `serviceCenterID` belongs to one centre and may only see and
 * touch that centre's work; `null` is ministry level and unscoped. That rule
 * already existed — `isInCenterScope`, `assertCenterScope` and
 * `centerScopeFilter` in ./authorize.ts — but it was applied in exactly two
 * places: the client list and the dashboard summary. Everything else took an id
 * from the request body and read or wrote it without asking whose it was, so a
 * centre officer could open another centre's client file, or any ទម្រង់ទី២-៦
 * record hanging off it, by changing the id in the URL.
 *
 * ទម្រង់ទី១ is the client and holds the centre itself. ទម្រង់ទី២-៦ have no
 * centre column — they reach it through the client they belong to, which is why
 * the check is a lookup rather than a field comparison, and why it lives here
 * rather than being written out five times.
 *
 * The helpers throw rather than returning a boolean. A scope check that can be
 * ignored by not reading the result is the failure this file exists to fix.
 */

/** The centre a client belongs to. `undefined` means there is no such client. */
export async function centreOfClient(
  event: H3Event,
  clientId: string
): Promise<string | null | undefined> {
  const row = await event.context.prisma.client_PersonalInformation.findUnique({
    where: { id: clientId },
    select: { serviceCenterID: true },
  });
  return row === null ? undefined : row.serviceCenterID;
}

/**
 * Throws 403 unless the caller may act on this client and everything filed
 * under it. A missing client is 404 — saying "forbidden" for an id that does not
 * exist tells a caller the id is real, which is the opposite of what scoping is
 * for.
 */
export async function assertClientScope(event: H3Event, clientId: unknown): Promise<void> {
  if (typeof clientId !== "string" || clientId.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "clientId is required" });
  }

  const caller = await getAuthUser(event);
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  // Ministry level sees everything; skip the lookup entirely.
  if (caller.serviceCenterID === null) return;

  const centre = await centreOfClient(event, clientId);
  if (centre === undefined) {
    throw createError({
      statusCode: 404,
      statusMessage: errorMessage(event, "រកមិនឃើញអតិថិជននេះទេ"),
    });
  }

  assertCenterScope(event, caller, centre);
}

/**
 * Throws unless the caller may act on the ទម្រង់ទី២-៦ record with this id.
 *
 * Used on the read and delete paths, where the request names the record rather
 * than the client it belongs to. Returns the record's `clientId` so a caller
 * that needs it does not have to read the row twice.
 */
export async function assertRecordScope(
  event: H3Event,
  delegate: { findUnique(args: any): Promise<any> },
  id: unknown
): Promise<string | null> {
  if (typeof id !== "string" || id.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "id is required" });
  }

  const caller = await getAuthUser(event);
  if (!caller) {
    throw createError({ statusCode: 401, statusMessage: "Unauthenticated" });
  }

  const row = await delegate.findUnique({
    where: { id },
    select: { clientId: true, client: { select: { serviceCenterID: true } } },
  });
  if (!row) {
    // Let the handler's own not-found message stand — it names the form.
    return null;
  }

  if (caller.serviceCenterID !== null) {
    assertCenterScope(event, caller, row.client?.serviceCenterID);
  }
  return row.clientId ?? null;
}

/**
 * A Prisma `where` fragment restricting a ទម្រង់ទី២-៦ query to the caller's
 * centre, reached through the client. The client-table equivalent of
 * `centerScopeFilter`.
 */
export async function clientCentreFilter(
  event: H3Event
): Promise<{ client?: { serviceCenterID: string } }> {
  const caller = await getAuthUser(event);
  if (!caller || caller.serviceCenterID === null) return {};
  return { client: { serviceCenterID: caller.serviceCenterID } };
}

/**
 * The centre a new or edited record must be filed under.
 *
 * A centre-bound user has exactly one answer and does not get to choose: the
 * form sends `serviceCenterID` in its body, and a body is not a permission
 * check. Ministry-level users keep whatever the form chose, which is why the
 * requested value is returned rather than rejected.
 */
export async function resolveWriteCentre(
  event: H3Event,
  requested: unknown
): Promise<string | null> {
  const caller = await getAuthUser(event);
  if (caller?.serviceCenterID) return caller.serviceCenterID;
  return typeof requested === "string" && requested.length > 0 ? requested : null;
}
