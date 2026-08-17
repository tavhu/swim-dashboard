/**
 * Server-side search, sort and paging for the list endpoints.
 *
 * Every list screen in this app fetches a page at a time, but until now only
 * `/api/service` actually did the work on the server. The rest ignored the
 * search term and the sort column entirely and returned `take: 1000` ordered by
 * id — so the search box and the sortable headers did nothing, and the totals
 * shown under the table counted the whole table rather than the matches.
 *
 * Two things this deliberately does not do:
 *
 *   - it never passes a client-supplied string to `orderBy` unchecked. Prisma
 *     throws on an unknown field, so an arbitrary `sortBy` is at minimum a 500
 *     on a public-ish endpoint; each caller passes the columns it will sort by.
 *   - it does not guess which columns are searchable. Searching a `Boolean` or
 *     a `DateTime` with `contains` is a Prisma error, so callers name the text
 *     columns explicitly.
 */

export type SortDirection = "asc" | "desc";

export interface ListQuery {
  /** The search term, trimmed; empty string when absent. */
  search: string;
  take: number;
  skip: number;
  sortBy: string;
  sortType: SortDirection;
}

export interface ListQueryOptions {
  /** Columns that may be sorted on. The first is the default. */
  sortable: readonly string[];
  /** Text columns searched with a case-insensitive `contains`. */
  searchable?: readonly string[];
  defaultSort?: string;
  defaultSortType?: SortDirection;
  defaultTake?: number;
  maxTake?: number;
}

/** Accepts both shapes in use: POST bodies and GET query strings. */
export function readListQuery(
  input: Record<string, any> | null | undefined,
  opts: ListQueryOptions
): ListQuery {
  const src = input ?? {};
  const maxTake = opts.maxTake ?? 200;

  const num = (v: any, fallback: number) => {
    const n = parseInt(String(v ?? ""), 10);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  };

  // `q` is what the vue3-tailwind tables send, `search` what the Nuxt UI ones
  // do; both appear in this codebase.
  const rawSearch = src.q ?? src.search ?? "";
  const search = typeof rawSearch === "string" ? rawSearch.trim() : "";

  const requested = String(src.sortBy ?? "");
  const fallbackSort = opts.defaultSort ?? opts.sortable[0];
  const sortBy = opts.sortable.includes(requested) ? requested : fallbackSort;

  const rawType = String(src.sortType ?? src.sortDirection ?? "").toLowerCase();
  const sortType: SortDirection =
    rawType === "asc" || rawType === "desc"
      ? rawType
      : opts.defaultSortType ?? "desc";

  return {
    search,
    take: Math.min(num(src.limit, opts.defaultTake ?? 10), maxTake),
    // `skip` from the vue3-tailwind tables, `offset` from the Nuxt UI ones.
    skip: num(src.skip ?? src.offset, 0),
    sortBy,
    sortType,
  };
}

/**
 * The `OR` clause for a search term, or undefined when there is nothing to
 * search for — so callers can spread it into a where object unconditionally.
 *
 * A dotted field searches through a relation: `ServiceCenter.nameKH` becomes
 * `{ ServiceCenter: { nameKH: { contains, mode } } }`.
 */
export function searchFilter(
  search: string,
  fields: readonly string[] | undefined
): { OR: any[] } | undefined {
  if (!search || !fields?.length) return undefined;

  const clause = (field: string): any => {
    const match = { contains: search, mode: "insensitive" as const };
    const parts = field.split(".");
    return parts.reduceRight<any>((acc, key) => ({ [key]: acc }), match);
  };

  return { OR: fields.map(clause) };
}

/**
 * `orderBy` for a validated sort column, expanding a dotted path the same way
 * searchFilter does: `ServiceCenter.nameKH` → `{ ServiceCenter: { nameKH } }`.
 */
export function orderByFor(sortBy: string, sortType: SortDirection): any {
  return sortBy
    .split(".")
    .reduceRight<any>((acc, key) => ({ [key]: acc }), sortType);
}
