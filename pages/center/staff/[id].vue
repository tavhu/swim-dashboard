<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * Staff detail view — both kinds.
 *
 * One page rather than two: the route carries ?type=Contract|Official, the API
 * already returns either shape, and every difference between them is a field
 * list. Sections render from computed field groups, so adding a column to one
 * kind never means touching the template twice.
 *
 * Print uses the same @media print stylesheet as ទម្រង់ views — nav/header
 * hide, content prints black-on-white.
 */

const config = useRuntimeConfig();
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const kind = computed(() => (route.query.type === "Contract" ? "Contract" : "Official"));
const staffId = computed(() => String(route.params.id ?? ""));

const staff = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const printPage = () => window.print();

const backTo = () => router.push("/center/staff");

const asset = (p?: string | null) =>
  p ? `${config.public.origin}/${String(p).replace(/^\/+/, "")}` : "";

const fmtDate = (d?: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

const fullName = computed(() => {
  const s = staff.value;
  if (!s) return "—";
  return kind.value === "Contract"
    ? [s.lastName, s.firstName].filter(Boolean).join(" ") || s.fullnameEN || "—"
    : [s.lastNameKH, s.firstNameKH].filter(Boolean).join(" ") || s.fullNameEN || s.firstNameEN || "—";
});

const latinName = computed(() => {
  const s = staff.value;
  if (!s) return "—";
  return (
    s.fullnameEN ||
    [s.lastNameEN, s.firstNameEN].filter(Boolean).join(" ") ||
    [s.firstName, s.lastName].filter(Boolean).join(" ") ||
    "—"
  );
});

/** Field groups per kind — label is Khmer; tr() resolves English at render. */
const sections = computed(() => {
  const s = staff.value;
  if (!s) return [];

  const f = (label: string, value: any) => ({ label, value: val(value) });

  if (kind.value === "Contract") {
    return [
      {
        title: tr("ព័ត៌មានផ្ទាល់ខ្លួន"),
        fields: [
          f("ឈ្មោះពេញ", fullName.value),
          f("ឈ្មោះឡាតាំង", latinName.value),
          f("ភេទ", s.gender),
          f("ថ្ងៃខែឆ្នាំកំណើត", fmtDate(s.dateofbirth)),
          f("សញ្ជាតិ", s.nationality),
          f("មុខតំណែង", s.position),
          f("លេខទូរស័ព្ទ", s.telephone),
          f("អ៊ីមែលគ្រួសារ", s.familyEmail),
          f("លេខទូរស័ព្ទគ្រួសារ", s.familyPhoneNumber),
        ],
      },
      {
        title: tr("អាសយដ្ឋាន"),
        fields: [
          f("អាសយដ្ឋានបច្ចុប្បន្ន", s.currentAddress),
          f("ទីក្រុង/ខេត្ត", s.currentCity),
          f("ស្រុក", s.currentDistrict),
          f("ឃុំ/សង្កាត់", s.currentCommune),
          f("ភូមិ", s.currentVillage),
          f("អាសយដ្ឋានគ្រួសារ", s.familyAddress),
        ],
      },
      {
        title: tr("កិច្ចសន្យាការងារ"),
        fields: [
          f("ថ្ងៃចាប់ផ្តើមធ្វើការ", fmtDate(s.workingPeroidStart)),
          f("លក្ខណៈសន្យា", s.workingEXPYes),
          f("ឯកសារកិច្ចសន្យា", s.attachedContract),
          f("ប្រវត្តិរូប (៤x៦)", s.attachedBackground),
          f("ព្រឹត្តិប័ត្រព័ត៌មាន", s.attachedFileInfomation),
        ],
      },
    ];
  }

  // Official (civil servant)
  return [
    {
      title: tr("ព័ត៌មានផ្ទាល់ខ្លួន"),
      fields: [
        f("ឈ្មោះពេញ", fullName.value),
        f("ឈ្មោះឡាតាំង", latinName.value),
        f("ភេទ", s.gender),
        f("ថ្ងៃខែឆ្នាំកំណើត", fmtDate(s.DateofBirth)),
        f("ជនជាតិ", s.nationality),
        f("ហេតុផល", s.ethnicity),
        f("លេខទូរស័ព្ទ", s.telephone),
        f("អ៊ីមែល", s.email),
        f("អត្តសញ្ញាណប័ណ្ណ", s.officialID),
        f("លេខសុខុមាលភាព", s.CambodianSocialID),
        f("ស្ថានភាពរាងកាយ", s.physical),
      ],
    },
    {
      title: tr("តំណែង និងការងារ"),
      fields: [
        f("ឋានៈ", s.CurrentRank),
        f("ឈ្មោះថ្នាក់", s.OfficialLevelKH),
        f("ថ្ងៃចាប់ផ្តើមរាជការ", fmtDate(s.DateStartOfficialWork)),
        f("ថ្ងៃចូលបម្រើពេញម៉ោង", fmtDate(s.DateWentFullTime)),
        f("សុពលភាពអត្តសញ្ញាណ (ចាប់ផ្តើម)", fmtDate(s.sIDValidStart)),
        f("សុពលភាពអត្តសញ្ញាណ (បញ្ចប់)", fmtDate(s.sIDValidEnd)),
        f("ព័ត៌មានគ្រួសារ", s.familyInfo),
      ],
    },
    {
      title: tr("អាសយដ្ឋាន"),
      fields: [
        f("កំណើត", [s.birthAddress, s.birthCity].filter(Boolean).join(", ") || null),
        f("អាសយដ្ឋានបច្ចុប្បន្ន", s.currentAddress),
        f("អាសយដ្ឋានអចិន្ត្រៃយ៍", s.permanentAddress),
      ],
    },
    {
      title: tr("ឪពុកម្តាយ"),
      fields: [
        f("ឈ្មោះឪពុក", s.fatherFullNameKH),
        f("មុខរបរឪពុក", s.fatherOccupation),
        f("ឈ្មោះម្តាយ", s.motherFullNameKH),
        f("មុខរបរម្តាយ", s.motherOcupation),
      ],
    },
    {
      title: tr("អ្នកទំនាក់ទំនងក្នុងហេតុចៃដន្យ"),
      fields: [
        f("ឈ្មោះ", [s.ECFirstNameKH, s.ECLastNameKH].filter(Boolean).join(" ") || null),
        f("ភេទ", s.ECGender),
        f("ជាប់ស្គាល់ជា", s.ECRelationshipAs),
        f("មុខរបរ", s.ECOccupation),
        f("អាសយដ្ឋាន", s.ECAddress),
        f("លេខទូរស័ព្ទ", s.ECTelehpone),
      ],
    },
    ...(s.spouseNameKH || s.spouseNameEN
      ? [
          {
            title: tr("គូស្វាមីភរិយា"),
            fields: [
              f("ឈ្មោះ", [s.spouseNameKH, s.spuseNameEN].filter(Boolean).join(" / ") || null),
              f("ថ្ងៃខែឆ្នាំកំណើត", fmtDate(s.spouseDateOfBirth)),
              f("លេខអត្តសញ្ញាណ", s.spouseSID),
              f("មុខរបរ", s.spouseCurrentOccupation),
              f("អង្គការ", s.spouseOrganisationName),
            ],
          },
        ]
      : []),
  ];
});

/** Repeatable child tables for civil servants. */
const childTables = computed(() => {
  const s = staff.value;
  if (!s || kind.value !== "Official") return [];

  const defs = [
    {
      title: "កូន",
      rows: s.governStaffChildren,
      columns: [
        { key: "fullnameKH", label: "ឈ្មោះពេញ" },
        { key: "gender", label: "ភេទ" },
        { key: "dateofBirth", label: "ថ្ងៃខែឆ្នាំកំណើត", date: true },
        { key: "occupation", label: "មុខរបរ" },
      ],
    },
    {
      title: "កម្រិតវគ្គសិក្សា",
      rows: s.governStaffQualifitcation,
      columns: [
        { key: "couseLevel", label: "កម្រិតវគ្គសិក្សា" },
        { key: "SchoolName", label: "ឈ្មោះសាលា" },
        { key: "SchoolLocation", label: "ទីតាំង" },
        { key: "CertificateLevel", label: "កម្រិតសញ្ញាបត្រ" },
        { key: "majoring", label: "ជំនាញ" },
        { key: "StartDate", label: "ចាប់ផ្តើម", date: true },
        { key: "finishDate", label: "បញ្ចប់", date: true },
      ],
    },
    {
      title: "ភាសា",
      rows: s.governStaffLanuage,
      columns: [
        { key: "langName", label: "ភាសា" },
        { key: "read", label: "អាន" },
        { key: "conversation", label: "និយាយ" },
        { key: "writing", label: "សរសេរ" },
      ],
    },
    {
      title: "ប្រវត្តិការងារ (រដ្ឋ)",
      rows: s.governStaffWorkingHistoryPublic,
      columns: [
        { key: "DateStartWorking", label: "ចាប់ផ្តើម", date: true },
        { key: "DateStopWorking", label: "បញ្ចប់", date: true },
        { key: "OgnisationName", label: "អង្គការ" },
        { key: "Department", label: "ដេប៉ាតេម៉ង់" },
        { key: "position", label: "មុខតំណែង" },
      ],
    },
    {
      title: "ប្រវត្តិការងារ (ឯកជន)",
      rows: s.governStaffWorkingHistoryPrivate,
      columns: [
        { key: "DateStartWorking", label: "ចាប់ផ្តើម", date: true },
        { key: "DateStopWorking", label: "បញ្ចប់", date: true },
        { key: "OgnisationName", label: "អង្គការ" },
        { key: "position", label: "មុខតំណែង" },
      ],
    },
    {
      title: "ប្រវត្តិមុខតំណែង",
      rows: s.governStaffPositionHistory,
      columns: [
        { key: "ValidDate", label: "ថ្ងៃខែ", date: true },
        { key: "MinistryName", label: "ក្រសួង" },
        { key: "Department", label: "ដេប៉ាតេម៉ង់" },
        { key: "oldOfficialLevel", label: "ថ្នាក់ចាស់" },
        { key: "newOffcialLevel", label: "ថ្នាក់ថ្មី" },
      ],
    },
    {
      title: "ការឡើងកម្រិតសញ្ញាបត្រ",
      rows: s.governStaffCertificateLevelup,
      columns: [
        { key: "validatDate", label: "ថ្ងៃខែ", date: true },
        { key: "SchoolName", label: "សាលា" },
        { key: "ReceivedCertificate", label: "សញ្ញាបត្រ" },
        { key: "OldPosition", label: "មុខតំណែងចាស់" },
        { key: "NewPosition", label: "មុខតំណែងថ្មី" },
      ],
    },
    {
      title: "លិខិតកោតសរសើរ",
      rows: s.governStaffLetterAppreciation,
      columns: [
        { key: "letterNumber", label: "លេខលិខិត" },
        { key: "OfficialDate", label: "ថ្ងៃខែ", date: true },
        { key: "RequestedOrginsation", label: "អង្គការ" },
        { key: "TypeReceived", label: "ប្រភេទ" },
      ],
    },
    {
      title: "ប្រវត្តិពិន័យ",
      rows: s.governStaffFineHistory,
      columns: [
        { key: "letterNumber", label: "លេខលិខិត" },
        { key: "OffialDate", label: "ថ្ងៃខែ", date: true },
        { key: "LetterDetails", label: "សេចក្ដីលម្អិត" },
        { key: "TypeRecieved", label: "ប្រភេទ" },
      ],
    },
  ];

  return defs.filter((d) => Array.isArray(d.rows) && d.rows.length > 0);
});

onMounted(async () => {
  pending.value = true;
  error.value = null;
  try {
    staff.value = await $fetch<any>("/api/center/staff/getSingleStaff", {
      method: "POST",
      body: { id: staffId.value, typeEmployee: kind.value },
    });
    if (!staff.value?.id) {
      error.value = tr("រកមិនឃើញបុគ្គលិកនេះទេ");
    }
  } catch (e: any) {
    error.value = apiErrorMessage(e, tr("មិនអាចទាញយកព័ត៌មានបានទេ"));
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <!-- Header: title + back & print, same row as client view -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">
            {{ kind === "Contract" ? tr("មន្ត្រីកិច្ចសន្យា") : tr("មន្ត្រីរាជការ") }}
          </h2>
          <p class="mt-1 text-base text-gray-500 dark:text-gray-400">{{ fullName }}</p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-2">
          <UButton color="gray" size="xl" @click="backTo">
            <TwFeather type="arrow-left" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t("action.back") }}</span>
          </UButton>
          <UButton color="primary" size="xl" @click="printPage">
            <TwFeather type="printer" :size="18" class="mr-1" />
            <span class="hidden font-[Moul] text-lg sm:inline">{{ $t("action.print") }}</span>
          </UButton>
        </div>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <!-- Loading -->
      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <!-- Error -->
      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        <UButton color="primary" class="mt-4" @click="backTo">
          <span class="font-[Moul]">{{ $t("action.back") }}</span>
        </UButton>
      </div>

      <div v-else-if="staff" class="space-y-6">
        <!-- Identity card -->
        <section class="rounded-lg bg-white p-5 shadow dark:bg-gray-800 no-print:flex">
          <img
            v-if="staff.photo"
            :src="asset(staff.photo)"
            alt=""
            class="h-32 w-24 rounded object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          />
          <div v-else
            class="flex h-32 w-24 items-center justify-center rounded bg-gray-100 text-3xl text-gray-400 dark:bg-gray-900 dark:text-gray-600">
            {{ (fullName || "?").charAt(0) }}
          </div>
          <div class="no-print:ml-5 mt-3 flex-1 sm:mt-0">
            <h3 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{ fullName }}</h3>
            <p class="text-gray-500 dark:text-gray-400">{{ latinName }}</p>
            <div class="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
              <span>{{ val(staff.gender) }}</span>
              <span v-if="staff.CurrentRank">{{ staff.CurrentRank }}</span>
              <span v-if="staff.position">{{ staff.position }}</span>
            </div>
          </div>
        </section>

        <!-- Field sections -->
        <section
          v-for="sec in sections"
          :key="sec.title"
          class="rounded-lg bg-white p-5 shadow dark:bg-gray-800"
        >
          <h3 class="mb-3 font-[Moul] text-base text-gray-700 dark:text-gray-200">
            {{ sec.title }}
          </h3>
          <dl class="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            <div v-for="field in sec.fields" :key="field.label" class="border-b border-gray-100 py-1 dark:border-gray-700/50">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ field.label }}</dt>
              <dd class="break-words text-gray-800 dark:text-gray-100">
                {{ typeof field.value === 'string' && /^uploads\//.test(field.value)
                    ? tr("មានឯកសារភ្ជាប់")
                    : field.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Child tables (civil servants) -->
        <section
          v-for="tbl in childTables"
          :key="tbl.title"
          class="overflow-x-auto rounded-lg bg-white p-5 shadow dark:bg-gray-800"
        >
          <h3 class="mb-3 font-[Moul] text-base text-gray-700 dark:text-gray-200">{{ tbl.title }}</h3>
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <th class="px-3 py-2 font-semibold">ល.រ</th>
                <th v-for="col in tbl.columns" :key="col.key" class="px-3 py-2 font-semibold">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in tbl.rows"
                :key="i"
                class="border-b last:border-0 dark:border-gray-700"
              >
                <td class="px-3 py-2 text-gray-500">{{ i + 1 }}</td>
                <td v-for="col in tbl.columns" :key="col.key" class="px-3 py-2 text-gray-800 dark:text-gray-100">
                  {{ col.date ? fmtDate(row[col.key]) : val(row[col.key]) }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
</template>
