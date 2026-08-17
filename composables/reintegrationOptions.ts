/**
 * The ទម្រង់ទី៤ choice lists, verbatim from the manual's sections ៣ and ៥.
 *
 * Hardcoded rather than made into tables, for the same reason as ទម្រង់ទី៣'s:
 * the manual fixes them, they are part of the national form rather than
 * something a centre maintains, and a reference table with no source of values
 * is what the ស្តារនីតិសម្បទា levels turned out to be.
 *
 * វិធីសាស្រ្តតាមដាន and លទ្ធផល in section ៥ are the same lists ទម្រង់ទី៣ uses, so
 * they are imported from there rather than restated — if the ministry revises
 * them, they should not disagree between two forms.
 */

/** ៣. អ្នកទទួល — who the client is handed over to. */
export const RECIPIENT = [
  "ឱពុកម្តាយ",
  "អាណាព្យាបាល",
  "ឱពុកម្តាយធម៌",
  "សាច់ញាតិ",
  "អាជ្ញាធរមានសមត្ថកិច្ច",
] as const;

/**
 * ២. លទ្ធផល of a service already delivered.
 *
 * Deliberately not MONITOR_RESULT: that asks how the client is doing right now
 * and offers ដំណើការធម្មតា, while this asks how a finished service turned out
 * and offers សះស្បើយ. The manual lists them separately and so do we.
 */
export const SERVICE_OUTCOME = [
  "មិនប្រក្រតី",
  "ផ្អាកដំណើការ",
  "ល្អប្រសើរជាងមុន",
  "សះស្បើយ",
] as const;

/** ៥. អ្នកផ្តល់ព័តមាន — ជ្រើសរើសបានច្រើន, so several may be chosen. */
export const INFORMANT = [
  "មេភូមិ",
  "មេឃុំ",
  "មេប៉ុស្តិ៍",
  "ប្រធានសហគម",
  "ឱពុកម្តាយ/សាច់ញាតិ",
] as const;

/** ភេទ for the commune and village chiefs. */
export const OFFICIAL_SEX = ["ប្រុស", "ស្រី"] as const;
