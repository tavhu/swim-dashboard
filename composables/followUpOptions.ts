/**
 * The ទម្រង់ទី៥ choice lists.
 *
 * វិធីសាស្រ្តតាមដាន, អ្នកផ្តល់ព័តមាន and the whole-visit លទ្ធផល are the lists
 * ទម្រង់ទី៣ and ទម្រង់ទី៤ already use, imported rather than restated so a
 * ministry revision cannot leave three forms disagreeing.
 *
 * The manual words section ៣'s fourth method as របាយការណ៍របស់អ្នកផ្តល់សេវាបន្ត
 * where the other forms say របាយការណ៍អ្នកផ្តល់សេវា. Treated as drafting drift
 * and shared — confirmed with the user rather than assumed.
 */

/** The two follow-ups the manual makes you choose between. */
export const FOLLOW_UP_STAGE = [
  {
    value: "IN_CENTRE",
    label: "ការអនុវត្តផែនការសកម្មភាពផ្តល់សេវាកម្ម",
    hint: "តាមដានពេលអតិថិជននៅមជ្ឈមណ្ឌល",
  },
  {
    value: "POST_REINTEGRATION",
    label: "ក្រោយពេលធ្វើសមាហរណកម្មទៅសហគមន៍",
    hint: "តាមដានក្រោយអតិថិជនត្រឡប់ទៅសហគមន៍",
  },
] as const;

/**
 * ២. លទ្ធផល, per service.
 *
 * Five options — the only list in the manual with all of them. ទម្រង់ទី៤'s
 * finished services drop ដំណើការធម្មតា; the monitoring lists drop សះស្បើយ. Kept
 * separate rather than folded into either, because the manual writes all three.
 */
export const FOLLOW_UP_SERVICE_OUTCOME = [
  "មិនប្រក្រតី",
  "ផ្អាកដំណើការ",
  "ដំណើការធម្មតា",
  "ល្អប្រសើរជាងមុន",
  "សះស្បើយ",
] as const;
