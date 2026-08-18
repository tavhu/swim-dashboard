/**
 * Turn the ISO date strings an API response carries back into `Date` objects.
 *
 * Prisma hands a handler real `Date`s, but JSON has no date type, so by the time
 * a record reaches the browser every one of them is a string like
 * `"2026-08-04T18:27:00.000Z"`. Loading that straight into a form means the
 * datepicker's `v-model` holds a string on the edit path and a `Date` on the
 * create path — the same control with two different model types depending on how
 * you got there.
 *
 * @vuepic/vue-datepicker does not cope with that. It renders the string well
 * enough to look right, which is what made this hard to spot, but its internal
 * calendar is derived from the model: choosing a year in the overlay computes
 * the new value from a date it does not have, applies nothing, and — with
 * `auto-apply` on — closes. From the user's side the year is picked, the
 * calendar vanishes, and the field is unchanged.
 *
 * The test is deliberately strict. Only a full ISO-8601 datetime is converted,
 * so a client's name, an address or a note is never mistaken for a date, and a
 * bare `"2026-08-04"` — which a `<input type="date">` produces and which is
 * unambiguous as text — is left alone.
 */

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** One value: an ISO string becomes a Date, anything else is returned as-is. */
export function toDate(v: unknown): unknown {
  if (typeof v === "string" && ISO_DATETIME.test(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : d;
  }
  return v;
}

/**
 * Walk a record and revive every ISO datetime in it, including inside nested
 * arrays — a client carries children, progress notes and serve history, and
 * those hold dates too.
 */
export function reviveDates<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => reviveDates(v)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = v && typeof v === "object" ? reviveDates(v) : toDate(v);
    }
    return out as unknown as T;
  }
  return toDate(value) as T;
}
