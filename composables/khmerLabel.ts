import DICTIONARY from "~/i18n/khmerLabels.json";

/**
 * English for a Khmer UI label, looked up by the Khmer itself.
 *
 * The six national forms carry roughly a thousand labels between them, written
 * directly into the templates. Giving each one an i18n key would mean inventing
 * a thousand key names, and every one of them is a chance to mistype a key and
 * render `form1.q14b` at a ministry officer. Keying on the Khmer string removes
 * that whole class of mistake: the key is the text, so it cannot disagree with
 * itself.
 *
 * **Anything missing falls back to the Khmer.** That is the property that makes
 * it safe to translate a 1,300-line form in pieces — an untranslated label shows
 * the original rather than a blank or a raw key, so the form is usable at every
 * point in between.
 *
 * The dictionary is a flat JSON file so a translator can work through it without
 * reading Vue, and so a reviewer at the ministry can see every rendering in one
 * place rather than hunting them across templates.
 */
const MAP = DICTIONARY as Record<string, string>;

/** Read the locale from anywhere — useI18n() is setup-only, this is not. */
const currentLocale = (): string => {
  try {
    return (useNuxtApp().$i18n as any)?.locale?.value ?? "km";
  } catch {
    return "km";
  }
};

export const tr = (khmer: string): string => {
  if (currentLocale() !== "en") return khmer;
  const en = MAP[khmer];
  if (en) return en;
  // Whitespace in templates is not always what it looks like; try a normalised
  // match before giving up and showing the Khmer.
  const squashed = khmer.replace(/\s+/g, " ").trim();
  return MAP[squashed] ?? khmer;
};

/** How much of the form has an English rendering — used by the coverage check. */
export const dictionarySize = () => Object.keys(MAP).length;
