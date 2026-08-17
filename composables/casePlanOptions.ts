/**
 * The ទម្រង់ទី៣ choice lists, verbatim from the manual's section ៣.
 *
 * Hardcoded rather than made into tables: the manual fixes these four options
 * each, they are part of the national form rather than something a centre
 * maintains, and the ស្តារនីតិសម្បទា levels are what a reference table with no
 * source of values looks like.
 */

/** វិធីសាស្រ្តតាមដាន */
export const MONITOR_METHOD = [
  "សង្កេតពីចម្ងាយ",
  "អង្កេត",
  "សម្ភាសន៍ផ្ទាល់ឬតាមទូរសព្ទសាម៉ីខ្លួននិងអ្នកពាក់ព័ន្ធ",
  "របាយការណ៍អ្នកផ្តល់សេវា",
] as const;

/** លទ្ធផល */
export const MONITOR_RESULT = [
  "មិនប្រក្រតី",
  "ផ្អាកដំណើការ",
  "ដំណើការធម្មតា",
  "ល្អប្រសើរជាងមុន",
] as const;

/** Age in whole years, for ឈ្មោះអតិថិជន(ភេទ, អាយុ). Derived, never stored — an
 *  age column is wrong within the year of being written. */
export function ageFrom(dob?: string | Date | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}
