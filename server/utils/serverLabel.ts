import type { H3Event } from "h3";
import DICTIONARY from "~~/i18n/khmerLabels.json";

/**
 * English for a Khmer label, on the server, in the language the caller is
 * reading.
 *
 * The client side translates by looking the Khmer string up in
 * i18n/khmerLabels.json (see composables/khmerLabel.ts). The server could not do
 * that, because it had no idea which language the caller had chosen — so an
 * officer reading the app in English still got a Khmer spreadsheet, and every
 * error message came back in Khmer whatever the picker said.
 *
 * The locale is not lost, though: `plugins/locale.client.ts` already stores the
 * choice in a `swims_locale` cookie, and the browser sends it with every
 * request. Reading it here needs no change to any caller and no new parameter on
 * any endpoint.
 *
 * Khmer remains the default and the fallback, in both directions: no cookie
 * means Khmer, and a string with no English rendering stays Khmer rather than
 * disappearing.
 */
const MAP = DICTIONARY as Record<string, string>;
const COOKIE = "swims_locale";

/** The caller's language, defaulting to Khmer — this is a Cambodian system. */
export function requestLocale(event: H3Event): string {
  const chosen = getCookie(event, COOKIE);
  return chosen === "en" ? "en" : "km";
}

/**
 * Translate one label for this request.
 *
 * Mirrors `tr()` on the client, including the whitespace-normalised second
 * attempt, so a string that translates in the browser translates in an export
 * too rather than the two quietly disagreeing.
 */
export function trFor(event: H3Event, khmer: string): string {
  if (requestLocale(event) !== "en") return khmer;
  if (!khmer) return khmer;
  const direct = MAP[khmer];
  if (direct) return direct;
  return MAP[khmer.replace(/\s+/g, " ").trim()] ?? khmer;
}

/** Bound to one request, for the many-labels case — exports especially. */
export function labelTranslator(event: H3Event) {
  const en = requestLocale(event) === "en";
  return (khmer: string): string => {
    if (!en || !khmer) return khmer;
    return MAP[khmer] ?? MAP[khmer.replace(/\s+/g, " ").trim()] ?? khmer;
  };
}

/**
 * For `createError({ statusMessage })`.
 *
 * Handlers percent-encode their Khmer because a status line must be Latin-1,
 * and the client decodes it again; this keeps that contract while translating
 * first, so one call replaces the `encodeURI("…")` that was there before.
 */
export function errorMessage(event: H3Event, khmer: string): string {
  return encodeURI(trFor(event, khmer));
}
