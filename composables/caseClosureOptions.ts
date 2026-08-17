/**
 * The ទម្រង់ទី៦ choice lists and fixed text, verbatim from the manual.
 */

/**
 * Which of the manual's two reason groups a closure was.
 *
 * The manual lists ក and ខ one after the other without saying to choose, but a
 * case closed successfully cannot also have absconding as its reason. Agreed
 * with the user rather than inferred silently.
 */
export const CLOSURE_OUTCOME = [
  { value: "SUCCESSFUL", label: "ក. សមាហរណកម្មជោគជ័យ", hint: "ករណីបិទដោយជោគជ័យ" },
  { value: "UNSUCCESSFUL", label: "ខ. សមាហរណកម្មមិនជោគជ័យ", hint: "ករណីបិទដោយមិនជោគជ័យ" },
] as const;

/** ក. ជ្រើសរើស — one only. */
export const CLOSURE_SUCCESS_REASON = [
  "គ្រួសារមានលំនឹង មានភាពធន់ (សមាហរណកម្មបាន១ឆ្នាំ)",
  "ជនរងគ្រោះរស់នៅមានលំនឹង មានភាពធន់ និងសុវត្ថិភាពល្អ (បានរយៈពេល១ឆ្នាំ)",
  "ផ្សេងទៀត",
] as const;

/** The one that opens a free-text box, kept as a constant so the form and the
 *  view agree on which option that is. */
export const CLOSURE_REASON_OTHER = "ផ្សេងទៀត";

/** ខ. ជ្រើសរើសបានច្រើន. */
export const CLOSURE_FAILURE_REASON = [
  "ទទួលមរណៈភាព",
  "ការទុកដាក់មិនស្របជាមួយមជ្ឈមណ្ឌល (មិនមែនជាជនរងគ្រោះ)",
  "គ្រួសារផ្លាស់ទីលំនៅ និងមិនអាចរកឃើញ",
  "ជនរងគ្រោះរត់បាត់ពីមជ្ឈមណ្ឌល/អង្គការ ឬកន្លែងស្នាក់នៅ និងមិនអាចរកឃើញ",
  "ជនរងគ្រោះរត់បាត់ពីប្រទេសគោលដៅ",
  "ឱពុកម្តាយ/សាច់ញាតិ បានយកជនរងគ្រោះទៅរស់នៅកន្លែងផ្សេង មិនអាចរកឃើញ",
  "ជនរងគ្រោះបានរត់បាត់ពីគ្រួសារ",
  "ជនរងគ្រោះ និងគ្រួសារមិនគោរពតាមកិច្ចសន្យា",
] as const;

/**
 * ៣. កំណត់សម្គាល់ — the manual's own definition of a stable reintegration.
 *
 * Not a field. It is the same words on every form, so it is shown as guidance
 * and printed with the record rather than stored on every row.
 */
export const CLOSURE_STABILITY_NOTE = {
  intro: "សមាហរណកម្ម ឬការទុកដាក់មានស្ថិរភាពមានន័យថា៖",
  points: [
    "ជនរងគ្រោះរស់នៅដោយមានសុវត្ថិភាពជាមួយគ្រួសារ ឬជាមួយអ្នកផ្តល់ការថែទាំជំនួស ដែលការពារពីការរំលោភបំពាន ការកេងប្រវ័ញ្ច និងអំពើហិង្សាក្នុងគ្រួសារ",
    "ជនរងគ្រោះបានចូលរួមសកម្មភាពក្នុងសហគមន៍ជាទៀងទាត់ដូច ទៅរៀន រកប្រាក់ចំណូល ឬកម្មវិធីផ្សេងៗ និងទទួលការបណ្តុះបណ្តាលវិជ្ជាជីវៈជាដើម",
    "ភស្តុតាងបង្ហាញថា ជនរងគ្រោះមានស្ថិរភាព ទាំងខាងសេដ្ឋកិច្ច និងផ្នែកចិត្តសង្គម។",
  ],
} as const;

/** ៤. The three questions asked of both the centre and the community. */
export const CLOSURE_SUMMARY_FIELDS = [
  { key: "Strengths", label: "ចំណុចខ្លាំងនៃសេវាកម្មបានផ្តល់" },
  { key: "Weaknesses", label: "ចំណុចខ្សោយនៃសេវាកម្មបានផ្តល់" },
  { key: "Vulnerabilities", label: "ភាពងាយរងគ្រោះនានាអាចកើត" },
] as const;
