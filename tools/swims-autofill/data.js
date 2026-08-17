/**
 * Khmer sample data for SWIMS Autofill.
 *
 * Plausible rather than random noise: a name field gets a Khmer name, an
 * address field a Khmer address, a phone field a Cambodian mobile number. Test
 * data that looks like real data is what makes a layout problem or a truncation
 * bug visible during entry — "asdasd" in every box hides all of them.
 *
 * Everything here is obviously fictional. Names are common given/family names
 * in ordinary combinations, and every record filled by this tool is prefixed so
 * it can be found and deleted later.
 */
const KH = {
  familyNames: ["សុខ", "ចាន់", "កែវ", "ម៉ែន", "ហេង", "ថេង", "ពៅ", "លី", "នូ", "ឈួន", "សំ", "យិន"],
  givenNamesM: ["សុភា", "ដារា", "វិសាល", "រតនា", "សំអាត", "ពិសិទ្ធ", "សុវណ្ណ", "ភក្តី", "មករា", "វុទ្ធី"],
  givenNamesF: ["សុភាព", "ចន្ទ្រា", "សុគន្ធា", "ម៉ាលី", "ដាលីន", "សិរីមុន", "កanha", "នារី", "សុជាតា", "ធីតា"],
  nicknames: ["ណា", "ដា", "ពៅ", "តូច", "ធំ", "ស្រី", "បង"],

  provinces: ["ភ្នំពេញ", "បន្ទាយមានជ័យ", "បាត់ដំបង", "សៀមរាប", "កណ្តាល", "កំពង់ចាម", "តាកែវ", "ព្រៃវែង"],
  districts: ["ស្រុកមង្គលបូរី", "ខណ្ឌដូនពេញ", "ស្រុកបាណន់", "ខណ្ឌចំការមន", "ស្រុកកៀនស្វាយ"],
  communes: ["ឃុំបត់ត្រង់", "សង្កាត់ផ្សារថ្មី", "ឃុំកំពង់ព្រះ", "សង្កាត់ទន្លេបាសាក់"],
  villages: ["ភូមិថ្មី", "ភូមិព្រែកតាសេក", "ភូមិចំការដូង", "ភូមិស្វាយ", "ភូមិកណ្តាល"],
  streets: ["ផ្លូវលេខ ២៧១", "ផ្លូវលេខ ១២៨", "មហាវិថីព្រះនរោត្តម", "ផ្លូវលេខ ៦៣"],

  occupations: ["កសិករ", "អ្នកលក់ដូរ", "ជាងកាត់សក់", "កម្មករសំណង់", "អ្នកបើកម៉ូតូ", "សិស្ស", "គ្មានមុខរបរ"],
  education: ["ថ្នាក់ទី៦", "ថ្នាក់ទី៩", "ថ្នាក់ទី១២", "បរិញ្ញាបត្រ", "មិនបានរៀន"],
  organisations: ["អង្គការសង្គ្រោះកុមារ", "អង្គការមូលដ្ឋានភូមិថ្មី", "សមាគមអភិវឌ្ឍន៍សហគមន៍"],
  centres: ["មជ្ឈមណ្ឌលថែទាំកុមារ", "មជ្ឈមណ្ឌលស្តារនីតិសម្បទា", "មណ្ឌលសុខភាពសហគមន៍"],
  positions: ["បុគ្គលិកសង្គមកិច្ច", "ប្រធានមជ្ឈមណ្ឌល", "មន្ត្រីតាមដាន", "គ្រូបណ្តុះបណ្តាល"],

  /** Free-text answers, so a textarea reads like a case note rather than "asdf". */
  sentences: [
    "អតិថិជនមានសុខភាពល្អ និងចូលរួមសកម្មភាពប្រចាំថ្ងៃជាទៀងទាត់។",
    "គ្រួសារមានបញ្ហាសេដ្ឋកិច្ច ត្រូវការជំនួយបន្ថែម។",
    "បានផ្តល់ការប្រឹក្សាយោបល់ និងតាមដានស្ថានភាពជាប្រចាំ។",
    "ត្រូវការការគាំទ្រផ្នែកចិត្តសាស្ត្រ និងការអប់រំបន្ត។",
    "អតិថិជនបានរីកចម្រើនគួរឱ្យកត់សម្គាល់ក្នុងរយៈពេលបីខែកន្លងមក។",
    "មិនទាន់មានព័ត៌មានបន្ថែមនៅឡើយទេ។",
  ],
  reasons: [
    "បញ្ជូនមកពីអាជ្ញាធរមូលដ្ឋាន",
    "គ្រួសារស្នើសុំដោយផ្ទាល់",
    "បញ្ជូនពីមណ្ឌលសុខភាព",
    "រកឃើញដោយក្រុមការងារចុះមូលដ្ឋាន",
  ],
};

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const digits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");

/** A Cambodian mobile number, in the shape people actually write them. */
const phone = () => "0" + pick(["10", "11", "12", "15", "16", "17", "60", "70", "77", "88", "92", "96"]) + digits(6);

const fullName = () => `${pick(KH.familyNames)} ${pick([...KH.givenNamesM, ...KH.givenNamesF])}`;

/** Marked so every row this tool creates can be found and removed afterwards. */
const TAG = "[TEST]";

const GEN = {
  name: fullName,
  nameEn: () => pick(["Sok Dara", "Chan Sophea", "Keo Ratana", "Men Vichea", "Heng Sovann"]),
  nickname: () => pick(KH.nicknames),
  phone,
  email: () => `test${digits(4)}@example.org`,
  website: () => `https://example.org/${digits(3)}`,
  address: () => `${pick(KH.villages)}, ${pick(KH.communes)}, ${pick(KH.districts)}, ${pick(KH.provinces)}`,
  house: () => `ផ្ទះលេខ ${digits(2)}`,
  street: () => pick(KH.streets),
  province: () => pick(KH.provinces),
  pob: () => `${pick(KH.villages)}, ${pick(KH.provinces)}`,
  occupation: () => pick(KH.occupations),
  education: () => pick(KH.education),
  organisation: () => `${TAG} ${pick(KH.organisations)}`,
  centre: () => `${TAG} ${pick(KH.centres)}`,
  position: () => pick(KH.positions),
  age: () => String(6 + Math.floor(Math.random() * 60)),
  count: () => String(1 + Math.floor(Math.random() * 5)),
  code: () => `T${digits(4)}`,
  idcard: () => digits(9),
  sentence: () => pick(KH.sentences),
  reason: () => pick(KH.reasons),
  generic: () => `${TAG} ${pick(KH.sentences)}`,
};

/**
 * Which generator a field wants, decided from its visible label first and its
 * attributes second — the labels in this app are Khmer, and `name`/`id` are
 * often absent or meaningless on the wrapped components.
 *
 * Order matters: the first match wins, so narrow patterns come before broad
 * ones. "ឈ្មោះសេវា" must be caught before the bare "ឈ្មោះ".
 */
const RULES = [
  [/អ៊ីមែល|អុីមែល|email/i, "email"],
  [/គេហទំព័រ|website|url/i, "website"],
  [/លេខទូរស័ព្ទ|ទូរស័ព្ទ|ទំនាក់ទំនង|phone|tel/i, "phone"],

  [/ឈ្មោះហៅក្រៅ|nickname/i, "nickname"],
  [/\(អង់គ្លេស\)|nameEn|english/i, "nameEn"],
  [/ឈ្មោះសេវា|ឈ្មោះស្ថាប័ន|ឈ្មោះមជ្ឈមណ្ឌល|ឈ្មោះអង្គភាព/i, "organisation"],
  [/ឈ្មោះតួនាទី|តួនាទី|position/i, "position"],
  [/នាមត្រកូល|គោត្តនាម|នាមខ្លួន|ឈ្មោះ|name/i, "name"],

  [/ផ្ទះលេខ/i, "house"],
  [/ផ្លូវលេខ/i, "street"],
  [/រាជធានី|ខេត្ត|province/i, "province"],
  [/ទីកន្លែងកំណើត/i, "pob"],
  [/អាសយដ្ឋាន|address/i, "address"],

  [/មុខរបរ|occupation/i, "occupation"],
  [/វប្បធម៌|កម្រិត|education/i, "education"],
  [/អាយុ|age/i, "age"],
  [/ចំនួន|លើកទី|count/i, "count"],
  [/លេខកូដ|លេខលិខិត|code/i, "code"],
  [/អត្តសញ្ញាណ|passport|សញ្ជាតិ/i, "idcard"],
  [/មូលហេតុ|reason/i, "reason"],
  [/បរិយាយ|យោបល់|សន្និដ្ឋាន|កំណត់ត្រា|ពិពណ៌នា|description|note/i, "sentence"],
];

function generatorFor(hint) {
  const h = String(hint || "").trim();
  for (const [re, key] of RULES) if (re.test(h)) return key;
  return "generic";
}

function valueFor(hint, type) {
  if (type === "email") return GEN.email();
  if (type === "url") return GEN.website();
  if (type === "tel") return GEN.phone();
  if (type === "number") return GEN.age();
  return GEN[generatorFor(hint)]();
}

// Reachable from the content script, which is injected in the same world.
window.__SWIMS_AUTOFILL_DATA__ = { GEN, RULES, generatorFor, valueFor, pick, TAG };
