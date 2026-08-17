<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";
import gazetteers from "~~/store/data/gazetteers";

/**
 * Reports.
 *
 * The page this replaces was the role-and-permission screen copied whole, with a
 * report heading on top — every request it made went to /api/role/*. None of it
 * produced a report.
 *
 * Six reports, one preview table, three downloads. The report definitions live
 * on the server (server/utils/reports.ts) and drive the preview and both Office
 * exports from the same query, so a download cannot disagree with the figures on
 * screen.
 *
 * PDF is the browser printing the preview, not a generated file: jspdf is
 * installed but carries no Khmer glyphs, so it renders Khmer as boxes. Printing
 * goes through the same @media print stylesheet the six ទម្រង់ use and produces a
 * correct Khmer document via Save as PDF.
 */
const toast = useToast();
useHead({ title: "របាយការណ៍" });

/** Must match the keys in server/utils/reports.ts. */
const REPORTS = [
  { key: "clients", title: "បញ្ជីអតិថិជន", hint: "អតិថិជនទាំងអស់ និងវឌ្ឍនភាពតាមទម្រង់", icon: "users", filters: ["date", "centre", "province"] },
  { key: "summary", title: "សង្ខេបតាមកាលបរិច្ឆេទ", hint: "តួលេខសម្រាប់ដាក់ជូនថ្នាក់លើ", icon: "bar-chart-2", filters: ["date", "centre"] },
  { key: "approval", title: "ស្ថានភាពការអនុម័ត", hint: "អ្វីដែលកំពុងរង់ចាំ និងរង់ចាំយូរប៉ុណ្ណា", icon: "clock", filters: ["centre"] },
  { key: "outcomes", title: "លទ្ធផលបិទករណី", hint: "ជោគជ័យ ឬមិនជោគជ័យ និងមូលហេតុ", icon: "check-circle", filters: ["date", "centre"] },
  { key: "services", title: "សេវាកម្មដែលបានផ្តល់", hint: "សេវាកម្មនីមួយៗ និងចំនួនដង", icon: "layers", filters: ["date"] },
  { key: "centres", title: "មជ្ឈមណ្ឌល", hint: "អតិថិជន បុគ្គលិក និងករណីបានបិទ", icon: "home", filters: [] },
] as const;

const selected = ref<string>("clients");
const def = computed(() => REPORTS.find((r) => r.key === selected.value)!);
const shows = (f: string) => (def.value.filters as readonly string[]).includes(f);

const dateFrom = ref<Date | string>("");
const dateTo = ref<Date | string>("");
const centreId = ref("");
const provinceCode = ref("");

const report = ref<any>(null);
const loading = ref(false);
const busyFormat = ref<string | null>(null);
/** Set only when a run actually failed, so the empty state can say which. */
const failed = ref(false);

const { data: centreList } = await useFetch<any>("/api/center/get", { method: "POST" });
const centres = computed(() => centreList.value?.data ?? []);
const provinces = computed(() =>
  (gazetteers as any[]).map((p) => ({ code: p.code, name: p.name.km })).sort((a, b) => a.name.localeCompare(b.name, "km"))
);

const payload = () => ({
  type: selected.value,
  dateFrom: shows("date") && dateFrom.value ? new Date(dateFrom.value).toISOString() : null,
  dateTo: shows("date") && dateTo.value ? new Date(dateTo.value).toISOString() : null,
  centreId: shows("centre") ? centreId.value || null : null,
  provinceCode: shows("province") ? provinceCode.value || null : null,
});

async function run() {
  loading.value = true;
  failed.value = false;
  try {
    const res: any = await $fetch("/api/report/data", { method: "POST", body: payload() });
    if (res?.error) throw new Error(res.error);
    report.value = res;
  } catch (e: any) {
    report.value = null;
    failed.value = true;
    toast.error({ message: e?.data?.error ?? e?.message ?? "មិនអាចបង្កើតរបាយការណ៍បានទេ" });
  } finally {
    loading.value = false;
  }
}

/** Excel and Word come back as a blob; the filename is on the response. */
async function download(format: "xlsx" | "docx") {
  busyFormat.value = format;
  try {
    const res = await fetch("/api/report/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...payload(), format }),
    });
    if (!res.ok) throw new Error(decodeURIComponent(res.statusText || "") || "មិនអាចទាញយកបានទេ");
    const blob = await res.blob();
    const name =
      res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ??
      `${selected.value}.${format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success({ message: "បានទាញយក " + name });
  } catch (e: any) {
    toast.error({ message: e?.message ?? "មិនអាចទាញយកបានទេ" });
  } finally {
    busyFormat.value = null;
  }
}

/** PDF: the browser's own Save as PDF over the printed preview. */
const printReport = () => window.print();

const resetFilters = () => {
  dateFrom.value = "";
  dateTo.value = "";
  centreId.value = "";
  provinceCode.value = "";
};

// Switching report shows it straight away. Clearing without re-running left the
// new title over the previous report's blank table, which read as a failure.
// Filters reset too: the ones the new report does not offer would otherwise sit
// in the payload unseen.
watch(selected, () => {
  report.value = null;
  failed.value = false;
  resetFilters();
  run();
});

onMounted(run);
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="no-print flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">របាយការណ៍</h2>
          <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
            ជ្រើសរើសរបាយការណ៍ កំណត់លក្ខខណ្ឌ បន្ទាប់មកទាញយក
          </p>
        </div>
      </div>
      <hr class="no-print my-2 border dark:border-gray-700" />

      <div class="grid grid-cols-12 items-start gap-4">
        <!-- Which report -->
        <section class="no-print col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 xl:col-span-3">
          <h3 class="text-xl font-[Moul] text-primary">ប្រភេទរបាយការណ៍</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="space-y-2">
            <button v-for="r in REPORTS" :key="r.key" type="button"
              class="flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors"
              :class="selected === r.key
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary dark:border-gray-700'"
              @click="selected = r.key">
              <TwFeather :type="r.icon" :size="18"
                :class="selected === r.key ? 'mt-0.5 shrink-0 text-primary' : 'mt-0.5 shrink-0 text-gray-400'" />
              <span class="min-w-0">
                <span class="block text-base text-gray-800 dark:text-gray-100">{{ r.title }}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">{{ r.hint }}</span>
              </span>
            </button>
          </div>
        </section>

        <div class="col-span-12 grid grid-cols-12 items-start gap-4 xl:col-span-9">
          <!-- Filters, in one row above the table -->
          <section class="no-print col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 class="text-xl font-[Moul] text-primary">លក្ខខណ្ឌ</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <p v-if="!def.filters.length" class="text-base text-gray-500 dark:text-gray-400">
              របាយការណ៍នេះមិនត្រូវការលក្ខខណ្ឌទេ។
            </p>
            <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <label v-if="shows('date')" class="block">
                <span class="text-sm text-gray-500 dark:text-gray-400">ចាប់ពី</span>
                <Datepicker v-model="dateFrom" :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
              </label>
              <label v-if="shows('date')" class="block">
                <span class="text-sm text-gray-500 dark:text-gray-400">ដល់</span>
                <Datepicker v-model="dateTo" :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
              </label>
              <label v-if="shows('centre')" class="block">
                <span class="text-sm text-gray-500 dark:text-gray-400">មជ្ឈមណ្ឌល</span>
                <select v-model="centreId"
                  class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                  <option value="">ទាំងអស់</option>
                  <option v-for="c in centres" :key="c.id" :value="c.id">{{ c.nameKH }}</option>
                </select>
              </label>
              <label v-if="shows('province')" class="block">
                <span class="text-sm text-gray-500 dark:text-gray-400">ខេត្ត</span>
                <select v-model="provinceCode"
                  class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                  <option value="">ទាំងអស់</option>
                  <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
              </label>
            </div>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <UButton color="primary" size="lg" :loading="loading" @click="run">
                <TwFeather type="search" :size="16" class="mr-1" />
                <span class="font-[Moul]">បង្កើតរបាយការណ៍</span>
              </UButton>
              <UButton v-if="def.filters.length" color="gray" size="lg" variant="soft" @click="resetFilters(); run()">
                <span>សម្អាតលក្ខខណ្ឌ</span>
              </UButton>

              <span class="mx-1 hidden h-6 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

              <UButton color="gray" size="lg" :disabled="!report?.rows?.length" :loading="busyFormat === 'xlsx'"
                @click="download('xlsx')">
                <TwFeather type="grid" :size="16" class="mr-1" />
                <span>Excel</span>
              </UButton>
              <UButton color="gray" size="lg" :disabled="!report?.rows?.length" :loading="busyFormat === 'docx'"
                @click="download('docx')">
                <TwFeather type="file-text" :size="16" class="mr-1" />
                <span>Word</span>
              </UButton>
              <UButton color="gray" size="lg" :disabled="!report?.rows?.length" @click="printReport">
                <TwFeather type="printer" :size="16" class="mr-1" />
                <span>PDF</span>
              </UButton>
            </div>
            <p class="mt-2 text-xs text-gray-400">
              PDF ប្រើមុខងារបោះពុម្ពរបស់កម្មវិធីរុករក (Save as PDF) ដើម្បីបង្ហាញអក្សរខ្មែរបានត្រឹមត្រូវ។
            </p>
          </section>

          <!-- The preview, and the thing that gets printed -->
          <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 class="text-xl font-[Moul] text-primary">{{ report?.title ?? def.title }}</h3>
            <p v-if="report" class="text-sm text-gray-500 dark:text-gray-400">{{ report.description }}</p>
            <p v-if="report" class="mt-1 text-xs text-gray-400">
              ចំនួន {{ report.total }} កំណត់ត្រា · បង្កើតនៅ
              {{ new Date(report.generatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </p>
            <hr class="my-2 border dark:border-gray-700" />

            <div v-if="loading" class="space-y-2">
              <div v-for="n in 6" :key="n" class="h-8 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            </div>

            <p v-else-if="failed" class="py-10 text-center text-base text-red-600 dark:text-red-400">
              មិនអាចបង្កើតរបាយការណ៍បានទេ។
            </p>

            <p v-else-if="!report" class="py-10 text-center text-base text-gray-500 dark:text-gray-400">
              ចុច «បង្កើតរបាយការណ៍» ដើម្បីមើលទិន្នន័យ។
            </p>

            <p v-else-if="!report.rows.length" class="py-10 text-center text-base text-gray-500 dark:text-gray-400">
              គ្មានទិន្នន័យសម្រាប់លក្ខខណ្ឌនេះទេ។
            </p>

            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="py-2 pr-3 font-normal">ល.រ</th>
                    <th v-for="c in report.columns" :key="c.key" class="py-2 pr-3 font-normal"
                      :class="c.numeric ? 'text-right' : ''">
                      {{ c.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="(row, i) in report.rows" :key="i">
                    <td class="py-2 pr-3 align-top tabular-nums text-gray-400">{{ i + 1 }}</td>
                    <td v-for="c in report.columns" :key="c.key"
                      class="py-2 pr-3 align-top text-gray-700 dark:text-gray-200"
                      :class="c.numeric ? 'text-right tabular-nums' : ''">
                      {{ row[c.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
