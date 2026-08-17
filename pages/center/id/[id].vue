<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

const config = useRuntimeConfig();
const route = useRoute();
const { t } = useI18n();

const serviceCenter = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

// Templates resolve names from setup scope, not from `window`, so the print
// call has to be a real function here.
const printPage = () => window.print();

const asset = (p?: string | null) =>
  p ? `${config.public.origin}/${String(p).replace(/^\/+/, "")}` : "";

const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// Field and section lists rather than a run of near-identical blocks: the old
// markup repeated `<strong>label:</strong> {{ value }}` seventeen times, which
// made the labels impossible to align and rendered every empty value as a bare
// trailing colon.
const generalFields = computed(() => {
  const c = serviceCenter.value;
  if (!c) return [];
  return [
    { label: "នាយក", value: c.directorName },
    { label: "ប្រភេទ", value: c.type },
    { label: "អ៊ីមែល", value: c.email, href: c.email ? `mailto:${c.email}` : null },
    { label: "ទូរស័ព្ទ", value: c.phoneNumber, href: c.phoneNumber ? `tel:${c.phoneNumber}` : null },
    { label: "ប្រអប់សំបុត្រ", value: c.PoBox },
    { label: "គេហទំព័រ", value: c.website, href: c.website },
    { label: "កាលបរិច្ឆេទបង្កើត", value: formatDate(c.createdAt) },
    { label: "ផែនទីទីតាំង", value: c.locationMap, href: c.locationMap },
    { label: "អាសយដ្ឋាន", value: c.Address, wide: true },
  ];
});

const locationFields = computed(() => {
  const c = serviceCenter.value;
  if (!c) return [];
  return [
    { label: "ក្រុង/ខេត្ត", value: c.City },
    { label: "ស្រុក/ខណ្ឌ", value: c.District },
    { label: "ឃុំ/សង្កាត់", value: c.Commute },
    { label: "ភូមិ", value: c.Village },
  ];
});

const proseSections = computed(() => {
  const c = serviceCenter.value;
  if (!c) return [];
  return [
    { title: "ទិដ្ឋភាពទូទៅ", body: c.overview },
    { title: "ផ្ទៃរឿង", body: c.background },
    { title: "បេសកកម្ម", body: c.mission },
    { title: "ចក្ខុវិស័យ", body: c.vision },
    { title: "គោលដៅ", body: c.goal },
    { title: "សេចក្តីសង្ខេបគម្រោង", body: c.ProjectSummary },
  ].filter((s) => s.body);
});

const centerPlans = computed(() =>
  (serviceCenter.value?.CenterPlan ?? []).map((p: any, i: number) => ({
    ...p,
    number: i + 1,
    files: String(p.filePath ?? "").split(",").map((f: string) => f.trim()).filter(Boolean),
  }))
);

const staffGroups = computed(() => {
  const c = serviceCenter.value;
  if (!c) return [];
  const map = (rows: any[], kh: (s: any) => string, en: (s: any) => string, mail: string, tel: string) =>
    (rows ?? []).map((s: any, i: number) => ({
      number: i + 1,
      photo: asset(s.photo),
      nameKH: kh(s),
      nameEN: en(s),
      gender: s.gender,
      email: s[mail],
      phone: s[tel],
    }));
  return [
    {
      title: "បុគ្គលិកកិច្ចសន្យា",
      rows: map(c.staff, (s) => [s.firstName, s.lastName].filter(Boolean).join(" "), (s) => s.fullnameEN, "familyEmail", "familyPhoneNumber"),
    },
    {
      title: "បុគ្គលិករដ្ឋ",
      rows: map(c.governStaff, (s) => [s.firstNameKH, s.lastNameKH].filter(Boolean).join(" "), (s) => [s.firstNameEN, s.lastNameEN].filter(Boolean).join(" "), "email", "telephone"),
    },
  ].filter((g) => g.rows.length);
});

useHead(() => ({ title: serviceCenter.value?.nameKH || "មជ្ឈមណ្ឌល" }));

onMounted(async () => {
  try {
    serviceCenter.value = await $fetch("/api/center/getSingle", {
      method: "POST",
      body: { id: route.params.id },
    });
  } catch (e: any) {
    // The old version logged to the console and left the loading text up
    // forever, so a failed request looked identical to a slow one.
    error.value = e?.statusMessage || e?.message || t('message.loadFailed');
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="font-[Battambang]">
  <!--
    Card-on-grey, Moul headings in primary, Battambang body — the same shell the
    dashboard and the centre list use. Full width rather than a centred column,
    so a wide screen shows more than whitespace.

    Body text is `text-base` with generous leading. Battambang is loaded at
    weights 100 and 300 only, so bold Khmer would be synthesised by the browser
    and smear the stacked diacritics; hierarchy comes from size and colour here
    instead of weight.
  -->

    <div class="mt-5">
      <!-- Title -->
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">
          {{ serviceCenter?.nameKH || 'មជ្ឈមណ្ឌល' }}
        </h2>
        <UButton v-if="serviceCenter" color="primary" size="xl" class="no-print shrink-0" @click="printPage">
          <TwFeather type="printer" :size="18" class="mr-1" />
          <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.print') }}</span>
        </UButton>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-12 gap-4">
        <div v-for="n in 4" :key="n" class="col-span-12 h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800"
          :class="n === 1 ? 'xl:col-span-4' : 'xl:col-span-8'" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <UButton color="primary" class="mt-4" @click="$router.go(0)">
          <span class="font-[Moul]">ព្យាយាមម្តងទៀត</span>
        </UButton>
      </div>

      <div v-else-if="serviceCenter" class="grid grid-cols-12 items-start gap-4">
        <!-- Identity -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 xl:col-span-4">
          <div class="flex flex-col items-center gap-3 text-center">
            <img v-if="serviceCenter.logo" :src="asset(serviceCenter.logo)" :alt="serviceCenter.nameEN"
              class="h-24 w-24 rounded-full border border-[#1d152a7a] object-cover" />
            <div>
              <h3 class="text-lg leading-loose text-gray-800 dark:text-gray-100">{{ serviceCenter.nameKH }}</h3>
              <p v-if="serviceCenter.nameEN" class="mt-1 text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {{ serviceCenter.nameEN }}
              </p>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-base" :class="serviceCenter.status
              ? 'bg-primary/10 text-primary'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
              <span class="h-2 w-2 rounded-full bg-current" />
              {{ serviceCenter.status ? 'ដំណើការ' : 'បិទដំណើការ' }}
            </span>
          </div>
        </section>

        <!-- General -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 xl:col-span-8">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានមជ្ឈមណ្ឌលសេវាកម្ម</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 2xl:grid-cols-3">
            <div v-for="f in generalFields" :key="f.label" :class="f.wide ? 'sm:col-span-2 2xl:col-span-3' : ''">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                <a v-if="f.href && f.value" :href="f.href" target="_blank" rel="noopener"
                  class="text-primary hover:underline">{{ f.value }}</a>
                <span v-else>{{ f.value || '—' }}</span>
              </dd>
            </div>
          </dl>
        </section>

        <!-- Location -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានលម្អិតអំពីទីតាំង</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-4">
            <div v-for="f in locationFields" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 text-base leading-relaxed text-gray-800 dark:text-gray-100">{{ f.value || '—' }}</dd>
            </div>
          </dl>
        </section>

        <!-- Narrative -->
        <section v-for="s in proseSections" :key="s.title"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 md:col-span-6 2xl:col-span-4">
          <h3 class="text-xl font-[Moul] text-primary">{{ s.title }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <p class="whitespace-pre-line text-base leading-loose text-gray-700 dark:text-gray-300">{{ s.body }}</p>
        </section>

        <!-- Plans -->
        <section v-if="centerPlans.length"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">ផែនការមជ្ឈមណ្ឌល</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="overflow-x-auto">
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-3 pr-4 font-normal">ល.រ</th>
                  <th class="py-3 pr-4 font-normal">ផែនការសកម្មភាព</th>
                  <th class="py-3 pr-4 font-normal">កំណត់ចំណាំ</th>
                  <th class="py-3 pr-4 font-normal">ផែនការឆ្នាំ</th>
                  <th class="py-3 font-normal">ឯកសារ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="p in centerPlans" :key="p.id ?? p.number">
                  <td class="py-3 pr-4 align-top text-gray-500">{{ p.number }}</td>
                  <td class="py-3 pr-4 align-top text-gray-800 dark:text-gray-100">{{ p.actvityPlan || '—' }}</td>
                  <td class="py-3 pr-4 align-top leading-relaxed text-gray-800 dark:text-gray-100">{{ p.note || '—' }}</td>
                  <td class="py-3 pr-4 align-top text-gray-800 dark:text-gray-100">{{ p.yearPlan || '—' }}</td>
                  <td class="py-3 align-top">
                    <template v-if="p.files.length">
                      <a v-for="(f, i) in p.files" :key="i" :href="asset(f)" target="_blank" rel="noopener"
                        class="block break-all text-primary hover:underline">{{ f.split('/').pop() }}</a>
                    </template>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Staff -->
        <section v-for="group in staffGroups" :key="group.title"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ group.title }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="overflow-x-auto">
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-3 pr-4 font-normal">ល.រ</th>
                  <th class="py-3 pr-4 font-normal">រូបថត</th>
                  <th class="py-3 pr-4 font-normal">ឈ្មោះ (ខ្មែរ)</th>
                  <th class="py-3 pr-4 font-normal">ឈ្មោះ (អង់គ្លេស)</th>
                  <th class="py-3 pr-4 font-normal">ភេទ</th>
                  <th class="py-3 pr-4 font-normal">អ៊ីមែល</th>
                  <th class="py-3 font-normal">ទូរស័ព្ទ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="r in group.rows" :key="r.number">
                  <td class="py-3 pr-4 text-gray-500">{{ r.number }}</td>
                  <td class="py-3 pr-4">
                    <img v-if="r.photo" :src="r.photo" alt=""
                      class="h-10 w-10 rounded-full border border-[#1d152a7a] object-cover" />
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.nameKH || '—' }}</td>
                  <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.nameEN || '—' }}</td>
                  <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.gender || '—' }}</td>
                  <td class="py-3 pr-4 break-all text-gray-800 dark:text-gray-100">{{ r.email || '—' }}</td>
                  <td class="py-3 text-gray-800 dark:text-gray-100">{{ r.phone || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
