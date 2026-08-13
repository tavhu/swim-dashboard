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

const asMap = (pairs: Array<[string, string]>) => Object.fromEntries(pairs);

export const GENDER = asMap([
  ["ប្រុស", "ប្រុស"],
  ["ស្រី", "ស្រី"],
  ["ផ្សេងៗ", "ផ្សេងៗ"],
]);

export const REASON_USE_DRUG = asMap([
  ["Fun", "ដើម្បីសប្បាយ"],
  ["followFriend", "ធ្វើតាមមិត្តភក្តិ"],
  ["forceUse", "មានគេបង្ខំ"],
  ["try", "ចង់សាក"],
  ["familyBroken", "បែកបាក់គ្រួសារ"],
  ["other", "មូលហេតុផ្សេង"],
]);

export const TYPE_DRUG_USED = asMap([
  ["SmileGlue", "ហិតកាវ"],
  ["yama", "យ៉ាមា-យ៉ាបា"],
  ["heroin", "ហេរ៉ូអុីន"],
  ["cocain", "កូកាអុីន"],
  ["smoking", "ជក់បារី"],
  ["drinking", "ផឹកស្រា"],
  ["other", "ផ្សេង"],
]);

export const LIVING_SITUATION = asMap([
  ["rural", "ជនបទ"],
  ["Anarchy", "តំបន់អនាធិបតេយ្យ"],
  ["Crowded", "ទីប្រជុំជន"],
  ["thief", "តំបន់ចោរកម្ម"],
  ["frequentviolent", "តបន់អំពើហឹង្សាញឹកញាប់"],
  ["gangArea", "តំបន់ ក្រុមបងធំ"],
  ["DrugArea", "តំបន់ប្រើប្រាស់គ្រឿងញៀន"],
  ["wealthy", "តំបន់អ្នកមាន"],
  ["PoorArea", "តំបន់ក្រីក្រ"],
]);

export const FUTURE_PLAN = asMap([
  ["sentClientTo", "បញ្ជូនអតិថិជនទៅ"],
  ["Educated", "អប់រំ ឬបណ្តុះបណ្តាលវិជ្ជាជីវៈ"],
  ["consultant", "ផ្តល់ការពិគ្រោះបញ្ហា/ពិគ្រោះយោបល់"],
  ["sentToHospital", "បញ្ចូនទៅសេវាព្យាបាល"],
  ["other", "ផែនការផ្សេងៗទៀត"],
]);

/** Unknown codes fall through to the code itself, which beats showing nothing. */
export const label = (map: Record<string, string>, value?: string | null) =>
  value ? map[value] ?? value : "—";

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
  return {
    province: province?.name?.km ?? provinceCode ?? "—",
    district: district?.name?.km ?? districtCode ?? "—",
    commune: commune?.name?.km ?? communeCode ?? "—",
    village: village?.name?.km ?? villageCode ?? "—",
  };
}
