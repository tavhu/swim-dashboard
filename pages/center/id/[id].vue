<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

const config = useRuntimeConfig();
const route = useRoute();

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

// Field lists rather than a run of near-identical <p> blocks: the old markup
// repeated `<strong>label:</strong> {{ value }}` seventeen times, which made
// the labels impossible to align and every empty value render as a bare colon.
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

// Six prose sections that were previously six copy-pasted blocks.
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
    files: String(p.filePath ?? "")
      .split(",")
      .map((f: string) => f.trim())
      .filter(Boolean),
  }))
);

const staff = computed(() =>
  (serviceCenter.value?.staff ?? []).map((s: any, i: number) => ({
    number: i + 1,
    photo: asset(s.photo),
    nameKH: [s.firstName, s.lastName].filter(Boolean).join(" "),
    nameEN: s.fullnameEN,
    gender: s.gender,
    email: s.familyEmail,
    phone: s.familyPhoneNumber,
  }))
);

const governStaff = computed(() =>
  (serviceCenter.value?.governStaff ?? []).map((s: any, i: number) => ({
    number: i + 1,
    photo: asset(s.photo),
    nameKH: [s.firstNameKH, s.lastNameKH].filter(Boolean).join(" "),
    nameEN: [s.firstNameEN, s.lastNameEN].filter(Boolean).join(" "),
    gender: s.gender,
    email: s.email,
    phone: s.telephone,
  }))
);

onMounted(async () => {
  try {
    serviceCenter.value = await $fetch("/api/center/getSingle", {
      method: "POST",
      body: { id: route.params.id },
    });
  } catch (e: any) {
    // The old version logged to the console and left the loading text up
    // forever, so a failed request looked identical to a slow one.
    error.value = e?.statusMessage || e?.message || "មិនអាចទាញយកព័ត៌មានបានទេ";
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-6">
    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <div class="h-20 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
      <div class="h-56 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    </div>

    <!-- Error -->
    <div v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/40">
      <p class="text-sm font-medium text-red-700 dark:text-red-300">{{ error }}</p>
      <button type="button" class="mt-3 text-sm text-primary hover:underline" @click="$router.go(0)">
        ព្យាយាមម្តងទៀត
      </button>
    </div>

    <article v-else-if="serviceCenter" class="space-y-8">
      <!-- Header -->
      <header class="print-block flex items-start gap-4 border-b border-gray-200 pb-6 dark:border-gray-800">
        <img v-if="serviceCenter.logo" :src="asset(serviceCenter.logo)" :alt="serviceCenter.nameEN"
          class="h-16 w-16 shrink-0 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
        <div class="min-w-0 flex-1">
          <h1 class="text-xl font-semibold leading-snug text-gray-900 dark:text-white">
            {{ serviceCenter.nameKH }}
          </h1>
          <p v-if="serviceCenter.nameEN" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ serviceCenter.nameEN }}
          </p>
          <span class="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="serviceCenter.status
            ? 'bg-primary/10 text-primary'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'">
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ serviceCenter.status ? 'ដំណើការ' : 'បិទដំណើការ' }}
          </span>
        </div>
        <button type="button" @click="printPage"
          class="no-print inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
          <TwFeather type="printer" :size="16" />
          <span class="hidden sm:inline">បោះពុម្ព</span>
        </button>
      </header>

      <!-- General -->
      <section class="print-block">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          ព័ត៌មានមជ្ឈមណ្ឌលសេវាកម្ម
        </h2>
        <dl class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div v-for="f in generalFields" :key="f.label" :class="f.wide ? 'sm:col-span-2' : ''">
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
            <dd class="mt-0.5 break-words text-sm text-gray-900 dark:text-gray-100">
              <a v-if="f.href && f.value" :href="f.href" target="_blank" rel="noopener"
                class="text-primary hover:underline">{{ f.value }}</a>
              <span v-else>{{ f.value || '—' }}</span>
            </dd>
          </div>
        </dl>
      </section>

      <!-- Location -->
      <section class="print-block">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          ព័ត៌មានលម្អិតអំពីទីតាំង
        </h2>
        <dl class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          <div v-for="f in locationFields" :key="f.label">
            <dt class="text-xs text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
            <dd class="mt-0.5 text-sm text-gray-900 dark:text-gray-100">{{ f.value || '—' }}</dd>
          </div>
        </dl>
      </section>

      <!-- Narrative sections -->
      <section v-for="s in proseSections" :key="s.title" class="print-block">
        <h2 class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ s.title }}
        </h2>
        <p class="whitespace-pre-line text-sm leading-relaxed text-gray-800 dark:text-gray-200">{{ s.body }}</p>
      </section>

      <!-- Plans -->
      <section v-if="centerPlans.length" class="print-block">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          ផែនការមជ្ឈមណ្ឌល
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="py-2 pr-4 font-medium">ល.រ</th>
                <th class="py-2 pr-4 font-medium">ផែនការសកម្មភាព</th>
                <th class="py-2 pr-4 font-medium">កំណត់ចំណាំ</th>
                <th class="py-2 pr-4 font-medium">ផែនការឆ្នាំ</th>
                <th class="py-2 font-medium">ឯកសារ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="p in centerPlans" :key="p.id ?? p.number">
                <td class="py-2 pr-4 align-top text-gray-500">{{ p.number }}</td>
                <td class="py-2 pr-4 align-top">{{ p.actvityPlan || '—' }}</td>
                <td class="py-2 pr-4 align-top">{{ p.note || '—' }}</td>
                <td class="py-2 pr-4 align-top">{{ p.yearPlan || '—' }}</td>
                <td class="py-2 align-top">
                  <template v-if="p.files.length">
                    <a v-for="(f, i) in p.files" :key="i" :href="asset(f)" target="_blank" rel="noopener"
                      class="block text-primary hover:underline">{{ f.split('/').pop() }}</a>
                  </template>
                  <span v-else class="text-gray-400">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Staff tables: same shape, so one markup block drives both. -->
      <section v-for="group in [
        { title: 'បុគ្គលិកកិច្ចសន្យា', rows: staff },
        { title: 'បុគ្គលិករដ្ឋ', rows: governStaff },
      ].filter(g => g.rows.length)" :key="group.title" class="print-block">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {{ group.title }}
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="py-2 pr-4 font-medium">ល.រ</th>
                <th class="py-2 pr-4 font-medium">រូបថត</th>
                <th class="py-2 pr-4 font-medium">ឈ្មោះ (ខ្មែរ)</th>
                <th class="py-2 pr-4 font-medium">ឈ្មោះ (អង់គ្លេស)</th>
                <th class="py-2 pr-4 font-medium">ភេទ</th>
                <th class="py-2 pr-4 font-medium">អ៊ីមែល</th>
                <th class="py-2 font-medium">ទូរស័ព្ទ</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="r in group.rows" :key="r.number">
                <td class="py-2 pr-4 text-gray-500">{{ r.number }}</td>
                <td class="py-2 pr-4">
                  <img v-if="r.photo" :src="r.photo" alt=""
                    class="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
                  <span v-else class="text-gray-400">—</span>
                </td>
                <td class="py-2 pr-4">{{ r.nameKH || '—' }}</td>
                <td class="py-2 pr-4">{{ r.nameEN || '—' }}</td>
                <td class="py-2 pr-4">{{ r.gender || '—' }}</td>
                <td class="py-2 pr-4 break-all">{{ r.email || '—' }}</td>
                <td class="py-2">{{ r.phone || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </article>
  </div>
</template>
