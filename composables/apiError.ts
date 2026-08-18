/**
 * The human-readable reason a request failed.
 *
 * This app's endpoints report failure two different ways, and a caller that
 * handles only one of them shows the user nothing useful:
 *
 *   returned   `setResponseStatus(412); return { error: "…" }`
 *              — `error` is the message, as a string.
 *   thrown     `throw createError({ statusMessage: "…" })`
 *              — h3 serialises this as `{ error: true, statusCode,
 *                statusMessage, message }`. Here `error` is the boolean true,
 *                not a message. Reading it blindly puts the literal word
 *                "true" in front of the user.
 *
 * So `error` is only used when it is actually a string. Khmer messages are
 * percent-encoded by the handlers, because a status line must be Latin-1, and
 * are decoded back here.
 */
export function apiErrorMessage(e: any, fallback: string): string {
  const candidates = [
    e?.data?.error,
    e?.data?.statusMessage,
    e?.data?.message,
    e?.statusMessage,
    e?.message,
  ];

  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const trimmed = c.trim();
    if (!trimmed) continue;
    // h3's generic wrappers say nothing a user can act on.
    if (/^(true|false)$/i.test(trimmed)) continue;
    if (/^fetch failed$/i.test(trimmed)) continue;

    try {
      return decodeURIComponent(trimmed);
    } catch {
      // A message containing a stray % is not valid percent-encoding; show it
      // as it came rather than losing it.
      return trimmed;
    }
  }

  return fallback;
}
