/**
 * The name of a record, in the language the user is reading.
 *
 * Entities carry their English name under inconsistent column names — the
 * schema grew over time — so this checks the ones that exist rather than
 * assuming a single field:
 *
 *   ServiceCenter  nameEN        Staff   fullnameEN
 *   Service        nameEn        ClientType, ServiceType,
 *                                AssistiveGroup/Type/Device  nameEn
 *
 * **Falls back to Khmer, always.** Filling in an English name is optional
 * everywhere it exists, so most rows will not have one, and an English-reading
 * user is far better served by the Khmer name than by a blank cell or a dash.
 * That is what makes it safe not to demand two languages on every input.
 */
type Named = Record<string, any> | null | undefined;

const EN_FIELDS = ["nameEn", "nameEN", "fullnameEN", "nameEnglish"] as const;
const KH_FIELDS = ["nameKh", "nameKH", "name", "fullNameKH", "title"] as const;

const firstFilled = (rec: Named, fields: readonly string[]) => {
  if (!rec) return "";
  for (const f of fields) {
    const v = rec[f];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

export function useLocalisedName() {
  const { locale } = useI18n();

  /** The record's name for the current locale, Khmer when there is no English. */
  const localisedName = (rec: Named, fallback = "—") => {
    const kh = firstFilled(rec, KH_FIELDS);
    if (locale.value !== "en") return kh || firstFilled(rec, EN_FIELDS) || fallback;
    return firstFilled(rec, EN_FIELDS) || kh || fallback;
  };

  /**
   * Both names when they differ, for a printed record or a detail page where
   * the extra line is worth the space. One name when only one exists.
   */
  const bothNames = (rec: Named, fallback = "—") => {
    const kh = firstFilled(rec, KH_FIELDS);
    const en = firstFilled(rec, EN_FIELDS);
    if (kh && en && kh !== en) return locale.value === "en" ? `${en} (${kh})` : `${kh} (${en})`;
    return kh || en || fallback;
  };

  return { localisedName, bothNames };
}
