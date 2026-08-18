/**
 * Client-side route guard.
 *
 * It used to refuse a route only when a permission row existed saying so:
 *
 *     if (row.frontEndURL === to.name && !row.granted && !row.read) block
 *
 * A route with no row therefore fell through and was allowed. Only nineteen
 * pages had rows, so the ទម្រង់ទី២-៦ screens, the client and centre detail
 * pages and the dashboard were open to every signed-in account regardless of
 * role. Now the default is deny: a route that is gated must be granted.
 *
 * This is a convenience, not the enforcement. The server checks every request
 * independently — see server/middleware/authorize.ts. A guard that runs in the
 * browser can be skipped by anyone willing to open the console.
 */
import { ALWAYS_ALLOWED_ROUTES, APP_RESOURCE_ROUTES, LANDING_ORDER } from "~/shared/appResources";

export default defineNuxtRouteMiddleware(async (to) => {
  const routeName = String(to.name ?? "");
  if (!routeName) return;

  // Public pages and a user's own profile are never gated.
  if (ALWAYS_ALLOWED_ROUTES.has(routeName)) return;

  // Signing out leaves no session, and this guard has nothing to say about that
  // — @sidebase/nuxt-auth's own middleware sends the visitor to /login. Running
  // on regardless is what produced the 404 after logout: with no session there
  // are no grants, so every route looked denied, and abortNavigation() with no
  // argument renders as "Page Not Found: /".
  const { status, data: currentUser } = useAuth();
  if (status.value !== "authenticated") return;

  const data = await userPermission();
  const grants = data.readRoleToResource.value?.data?.Role?.resource ?? [];

  useState("userPermission", () => grants);

  const grantFor = (name: string) =>
    grants.find((g: any) => g?.Resource?.frontEndURL === name) ?? null;

  // Editing your own account is always allowed, whatever the grid says about
  // the register page — otherwise a user cannot change their own password.
  if (routeName === "register" && to.query?.id === (currentUser.value as any)?.sub) {
    return;
  }

  // A route the app does not gate at all (a component demo, say) is left alone
  // rather than being denied by default, which would break pages that were
  // never part of the permission model.
  if (!APP_RESOURCE_ROUTES.has(routeName)) return;

  const g = grantFor(routeName);
  if (g && (g.granted === true || g.read === true)) return;

  // Denied. Send them to the first page they can actually open rather than
  // bouncing off "/" — which they may also be denied, and which would leave the
  // app looping on a page it will not show.
  const landing = LANDING_ORDER.find(({ route }) => {
    const lg = grantFor(route);
    return !!lg && (lg.granted === true || lg.read === true);
  });

  if (landing && landing.route !== routeName) {
    return navigateTo(landing.path);
  }

  // Authenticated, but holding nothing at all. Say that, rather than letting a
  // bare abortNavigation() render as a 404 — the page exists; they may not open
  // it, and "not found" sends them looking for a broken link.
  return abortNavigation(
    createError({
      statusCode: 403,
      statusMessage: encodeURI("អ្នកមិនមានសិទ្ធិចូលមើលទំព័រនេះទេ"),
    })
  );
});
