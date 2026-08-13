/**
 * `useFetch` for this app's own API, with the session cookie attached.
 *
 * During server-side rendering Nuxt calls internal API routes through
 * `$fetch`, which builds a *fresh* request — the browser's cookies are not
 * carried over. Endpoints that check the session therefore see none on a hard
 * refresh and return nothing, while client-side navigation works because the
 * browser sends its own cookies. That's the "data on navigation, empty on
 * refresh" symptom.
 *
 * `useRequestHeaders` returns the incoming request's headers on the server and
 * an empty object in the browser, so this is safe on both sides.
 *
 * Use this instead of `useFetch` for any `/api/**` call. Plain `useFetch` is
 * still right for third-party URLs, which need no session.
 */
export function useApiFetch<T = unknown>(
  request: Parameters<typeof useFetch>[0],
  options: Record<string, any> = {}
) {
  const cookieHeaders = useRequestHeaders(["cookie"]);

  return useFetch<T>(request as any, {
    ...options,
    headers: {
      ...cookieHeaders,
      ...((options?.headers as Record<string, string>) ?? {}),
    },
  } as any);
}
