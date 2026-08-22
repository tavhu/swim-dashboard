import { hash } from "bcrypt";
import { RESOURCE } from "../../utils/policy";
import { writeActivityLog } from "../../utils/activityLog";

/**
 * Create or update a user account.
 *
 * Previously this checked only that *a* session existed, then passed the body
 * straight into `prisma.user.upsert`. Two consequences:
 *
 *   1. `userRoleID` came from the client, so any signed-in account could POST
 *      its own id with the Super Admin role id and promote itself. The role
 *      dropdown in `pages/register/index.vue` was the only thing limiting it,
 *      and a dropdown is not a permission check.
 *   2. `id` came from the client too, so any signed-in account could edit any
 *      other user — including sending `updatePass: true` to reset the
 *      ministry admin's password and take the account.
 *
 * Now: editing anyone other than yourself requires write on `register`, and
 * assigning a gated role requires write on that role's resource row — the same
 * rule `/api/role/get` already uses to build the dropdown.
 */
export default eventHandler(async (event) => {
  const caller = await requireAuth(event);
  const body = await readBody(event);

  const targetId: string | undefined = body?.id || undefined;
  const isSelf = !!targetId && targetId === caller.id;

  // Creating a user, or editing someone else, is an administrative act.
  if (!isSelf) {
    if (!userCan(caller, RESOURCE.userCreate, "write")) {
      throw createError({
        statusCode: 403,
        statusMessage: errorMessage(event, "អ្នកមិនមានសិទ្ធិគ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ទេ"),
      });
    }
  }

  // Editing your own profile must not be a route to a better role. The form
  // hides these fields when you edit yourself; enforce that on the server.
  let userRoleID = body?.userRoleID;
  let status = body?.status;
  if (isSelf) {
    const current = await event.context.prisma.user.findUnique({
      where: { id: caller.id },
      select: { userRoleID: true, status: true },
    });
    userRoleID = current?.userRoleID ?? null;
    status = current?.status ?? true;
  }

  await assertCanAssignRole(event, caller, userRoleID);

  /**
   * A centre-bound administrator creates accounts for their own centre only.
   *
   * `serviceCenterID` came straight from the body, and null means ministry
   * level — unscoped, sees every centre. So a centre administrator could create
   * an account with no centre at all, sign in as it, and be outside the scope
   * their own account is subject to. Every other centre check in the app is
   * downstream of this one, which makes it the one that has to hold.
   *
   * Editing yourself never reaches here for the centre either: your own centre
   * is not a field you may change.
   */
  let serviceCenterID = body?.serviceCenterID ?? null;
  if (caller.serviceCenterID) {
    if (isSelf) {
      serviceCenterID = caller.serviceCenterID;
    } else if (serviceCenterID !== caller.serviceCenterID) {
      throw createError({
        statusCode: 403,
        statusMessage: errorMessage(event, "អ្នកអាចបង្កើតគណនីសម្រាប់មជ្ឈមណ្ឌលរបស់ខ្លួនប៉ុណ្ណោះ"),
      });
    }
  }

  /**
   * Latin letters, digits and . _ - only, with no spaces.
   *
   * The form checks this too, but a form rule is not a constraint: this endpoint
   * takes a JSON body and nothing stops a caller sending whatever it likes. A
   * username is compared byte-for-byte at sign-in and typed on machines whose
   * keyboard may be in Khmer, so a Khmer character — or a space picked up from a
   * paste — creates an account its owner cannot reliably sign in to.
   */
  const username: unknown = body?.username;
  if (typeof username !== "string" || !/^[A-Za-z0-9._-]+$/.test(username)) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage(
        event,
        "ឈ្មោះគណនីត្រូវប្រើអក្សរឡាតាំង លេខ និងសញ្ញា . _ - ប៉ុណ្ណោះ ដោយគ្មានចន្លោះ"
      ),
    });
  }

  try {
    const data = {
      firstname: body?.firstname,
      lastname: body?.lastname,
      username: body?.username,
      image: body?.image,
      status,
      userRoleID,
      serviceCenterID,
      organisationID: body?.organisationID,
      accountType: body?.accountType,
    };

    if (targetId) {
      // Say so plainly. The register form used to send a placeholder id on
      // create, which landed here and came back as a raw P2025 — the page could
      // only report "not saved", giving no hint that it had tried to update a
      // user that does not exist.
      const exists = await event.context.prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true },
      });
      if (!exists) {
        throw createError({
          statusCode: 404,
          statusMessage: errorMessage(event, "រកមិនឃើញគណនីនេះទេ"),
        });
      }

      await event.context.prisma.user.update({
        where: { id: targetId },
        data: {
          ...data,
          // An empty password field means "leave it alone", not "set it to
          // undefined" — only hash and write when a new one was supplied.
          ...(body?.updatePass && body?.password
            ? { password: await hash(body.password, 12) }
            : {}),
        },
      });

      await writeActivityLog(event, {
        action: "UPDATE",
        entityType: "USER",
        entityId: targetId,
        summary: `Updated account ${data.username ?? ""}${isSelf ? " (own profile)" : ""}`.trim(),
        metadata: {
          self: isSelf,
          passwordReset: Boolean(body?.updatePass && body?.password),
          roleChanged: userRoleID !== undefined,
        },
        serviceCenterID,
      });
    } else {
      if (!body?.password) {
        throw createError({
          statusCode: 400,
          statusMessage: errorMessage(event, "សូមបញ្ចូលលេខសំងាត់"),
        });
      }
      const created = await event.context.prisma.user.create({
        data: { ...data, password: await hash(body.password, 12) },
        select: { id: true },
      });

      await writeActivityLog(event, {
        action: "CREATE",
        entityType: "USER",
        entityId: created.id,
        summary: `Created account ${data.username ?? ""}`,
        serviceCenterID,
      });
    }

    setResponseStatus(event, 201);
    return { message: "User Update or Created" };
  } catch (e: any) {
    if (e?.statusCode) throw e;
    // P2002 = unique constraint; the only one on User is `username`.
    if (e?.code === "P2002") {
      setResponseStatus(event, 409);
      return { error: errorMessage(event, "ឈ្មោះអ្នកប្រើប្រាស់នេះមានរួចហើយ") };
    }
    console.error("[user/upsert]", e);
    setResponseStatus(event, 412);
    return { error: e?.message ?? "Request failed" };
  }
});
