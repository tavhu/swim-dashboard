import gazetteers from "~/store/data/gazetteers";

/**
 * Display labels for the coded values stored on a client record.
 *
 * The intake form's selects store codes — `yama`, `followFriend`, `rural` — and
 * the address fields store gazetteer codes rather than names. Anything reading a
 * client back out needs these to show Khmer instead of the code, so they live
 * here rather than being duplicated by each reader.
 *
 * These mirror the option lists in components/client/PersonalForm.vue. If a
 * value is ever added there, add it here too, or the reader will fall back to
 * showing the raw code.
 */

/**
 * A coded value's label in both languages.
 *
 * The stored value is a code — `yama`, `followFriend`, `rural` — so translating
 * the label changes nothing in the database and is safe to get wrong and fix.
 * That is the line this file draws: a map whose *key* is already Khmer holds a
 * field value, not a label, and is left alone (see GENDER).
 *
 * The pairs live here rather than in i18n/locales because this file is already
 * the single source of display text for these codes, and it carries a standing
 * warning about staying in step with the form's own option lists. Splitting the
 * Khmer from the English across two files would add a second thing to keep in
 * step, which is exactly how the permissions list came to have two copies.
 */
export interface Bilingual {
  km: string;
  en: string;
}

const asMap = (triples: Array<[string, string, string]>): Record<string, Bilingual> =>
  Object.fromEntries(triples.map(([code, km, en]) => [code, { km, en }]));

/**
 * A map whose key is the stored value rather than a code.
 *
 * Some fields were built to store their Khmer label directly. Those values must
 * never change — existing rows hold them, and rewriting them would rewrite the
 * data. Giving such a field an English *display* is still correct and still
 * safe: nothing is written, and the key stays exactly what is in the column.
 */
const asStoredMap = (triples: Array<[string, string]>): Record<string, Bilingual> =>
  Object.fromEntries(triples.map(([stored, en]) => [stored, { km: stored, en }]));

export const GENDER = asStoredMap([
  ["ប្រុស", "Male"],
  ["ស្រី", "Female"],
  ["ផ្សេងៗ", "Other"],
]);

export const REASON_USE_DRUG = asMap([
  ["Fun", "ដើម្បីសប្បាយ", "For enjoyment"],
  ["followFriend", "ធ្វើតាមមិត្តភក្តិ", "Following friends"],
  ["forceUse", "មានគេបង្ខំ", "Was forced"],
  ["try", "ចង់សាក", "Wanted to try it"],
  ["familyBroken", "បែកបាក់គ្រួសារ", "Family breakdown"],
  ["other", "មូលហេតុផ្សេង", "Another reason"],
]);

export const TYPE_DRUG_USED = asMap([
  ["SmileGlue", "ហិតកាវ", "Glue sniffing"],
  ["yama", "យ៉ាមា-យ៉ាបា", "Yama / Yaba"],
  ["heroin", "ហេរ៉ូអុីន", "Heroin"],
  ["cocain", "កូកាអុីន", "Cocaine"],
  ["smoking", "ជក់បារី", "Tobacco"],
  ["drinking", "ផឹកស្រា", "Alcohol"],
  ["other", "ផ្សេង", "Other"],
]);

export const LIVING_SITUATION = asMap([
  ["rural", "ជនបទ", "Rural"],
  ["Anarchy", "តំបន់អនាធិបតេយ្យ", "Lawless area"],
  ["Crowded", "ទីប្រជុំជន", "Urban / crowded"],
  ["thief", "តំបន់ចោរកម្ម", "High-theft area"],
  ["frequentviolent", "តបន់អំពើហឹង្សាញឹកញាប់", "Area with frequent violence"],
  ["gangArea", "តំបន់ ក្រុមបងធំ", "Gang-controlled area"],
  ["DrugArea", "តំបន់ប្រើប្រាស់គ្រឿងញៀន", "Area with drug use"],
  ["wealthy", "តំបន់អ្នកមាន", "Affluent area"],
  ["PoorArea", "តំបន់ក្រីក្រ", "Poor area"],
]);

export const FUTURE_PLAN = asMap([
  ["sentClientTo", "បញ្ជូនអតិថិជនទៅ", "Refer the client to"],
  ["Educated", "អប់រំ ឬបណ្តុះបណ្តាលវិជ្ជាជីវៈ", "Education or vocational training"],
  ["consultant", "ផ្តល់ការពិគ្រោះបញ្ហា/ពិគ្រោះយោបល់", "Counselling"],
  ["sentToHospital", "បញ្ចូនទៅសេវាព្យាបាល", "Refer to treatment services"],
  ["other", "ផែនការផ្សេងៗទៀត", "Another plan"],
]);

/**
 * The active locale, readable from anywhere.
 *
 * `useI18n()` may only be called during a component's setup, and these helpers
 * are called from computeds, click handlers and plain functions. `$i18n` off
 * the Nuxt app has no such restriction. Falls back to Khmer, which is the
 * system's own language, if there is no app context at all.
 */
const currentLocale = (): string => {
  try {
    return (useNuxtApp().$i18n as any)?.locale?.value ?? "km";
  } catch {
    return "km";
  }
};

/**
 * The label for a stored code, in the language being read.
 *
 * Unknown codes fall through to the code itself, which beats showing nothing —
 * an unrecognised value in the database is a data question, and hiding it makes
 * that harder to notice rather than easier.
 */
export const label = (map: Record<string, Bilingual>, value?: string | null) => {
  if (!value) return "—";
  const entry = map[value];
  if (!entry) return value;
  return (currentLocale() === "en" ? entry.en : entry.km) || entry.km || value;
};

export const yesNo = (v: boolean | null | undefined, yes: string, no: string) =>
  v === true ? yes : v === false ? no : "—";

/**
 * Address fields hold gazetteer codes. Resolve the four levels together,
 * because each is only findable inside the one above it.
 */
export function resolveAddress(
  provinceCode?: string | null,
  districtCode?: string | null,
  communeCode?: string | null,
  villageCode?: string | null
) {
  const province = (gazetteers as any[]).find((p) => p.code === provinceCode);
  const district = province?.districts?.values?.find((d: any) => d.code === districtCode);
  const commune = district?.communes?.values?.find((c: any) => c.code === communeCode);
  const village = commune?.villages?.values?.find((v: any) => v.code === villageCode);
  // The gazetteer carries both names; this only ever read the Khmer one, so an
  // English page showed Khmer place names beside English labels. Khmer remains
  // the fallback — most village entries have no English name.
  const en = currentLocale() === "en";
  const pick = (n: any, code?: string | null) =>
    (en ? n?.en || n?.km : n?.km) ?? code ?? "—";

  return {
    province: pick(province?.name, provinceCode),
    district: pick(district?.name, districtCode),
    commune: pick(commune?.name, communeCode),
    village: pick(village?.name, villageCode),
  };
}
