import { isEnforced, matchRule, normalisePath } from "../utils/policy";
import { getAuthUser, userCan } from "../utils/authorize";

/**
 * Applies `server/utils/policy.ts` to every `/api/**` request before the route
 * handler runs.
 *
 * ## Gradual rollout
 *
 * The permission data in this database was reconstructed, not inherited, so
 * turning every endpoint on at once could lock users out of features that work
 * today. Every request is evaluated, but only paths listed in `ENFORCED` are
 * actually refused. Everything else logs what *would* have happened:
 *
 *   [authorize] WOULD REFUSE  POST /api/center/upsert  user=thona
 *               needs center/write
 *
 * Watch the logs, fix any surprises by granting the right resources, then add
 * the path to `ENFORCED`. When the log is quiet, enforce everything.
 */
export default eventHandler(async (event) => {
  const path = normalisePath(event.path || event.node.req.url || "");
  if (!path.startsWith("/api/") && path !== "/api") return;

  const method = event.method || event.node.req.method || "GET";
  const rule = matchRule(method, path);
  const enforcing = isEnforced(path);

  const refuse = (statusCode: number, statusMessage: string, why: string) => {
    if (enforcing) throw createError({ statusCode, statusMessage });
    console.warn(`[authorize] WOULD REFUSE  ${method} ${path}  — ${why}`);
  };

  if (!rule) {
    return refuse(
      403,
      "Forbidden: no access policy defined for this endpoint",
      "no policy rule; add one in server/utils/policy.ts"
    );
  }

  if (rule.mode === "public") return;

  if (rule.mode === "deny") {
    return refuse(410, "This endpoint has been disabled", "endpoint disabled");
  }

  const user = await getAuthUser(event);

  if (!user) {
    return refuse(401, "Unauthenticated", "no session");
  }

  if (!user.status) {
    return refuse(
      403,
      errorMessage(event, "គណនីត្រូវបានបិទ! សូមទំនាក់ទំនងអ្នកគ្រប់គ្រង"),
      `account disabled (${user.username})`
    );
  }

  if (rule.mode === "auth") return;

  if (!userCan(user, rule.resource, rule.action)) {
    return refuse(
      403,
      errorMessage(event, "អ្នកមិនមានសិទ្ធិសម្រាប់សកម្មភាពនេះទេ"),
      `user=${user.username} role=${user.roleName ?? "none"} needs ${rule.resource}/${rule.action}`
    );
  }
});
