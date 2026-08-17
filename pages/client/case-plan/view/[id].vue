<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ទម្រង់ទី៣ read view — same shell and print stylesheet as the other forms, so
 * បោះពុម្ព produces a black-on-white document through the browser's own Save as
 * PDF. The approval block is the shared panel, not a copy.
 *
 * Section ១ is read through the client relation and marked (ទម្រង់ទី១), so a
 * reader knows where those answers came from rather than wondering why they
 * cannot be edited here.
 */
const route = useRoute();
const readOnly = checkIfPageReadOnly();

const rec = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const printPage = () => window.print();

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

const clientAge = computed(() => ageFrom(rec.value?.client?.DOB));

const familyAddress = computed(() => {
  const c = rec.value?.client;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

/** ១. ព័ត៌មានអតិថិជន — every one of these lives on ទម្រង់ទី១. */
const clientFields = computed(() => {
  const c = rec.value?.client;
  if (!c) return [];
  const nameWithDetail = [c.Gender, clientAge.value !== null ? `${clientAge.value} ឆ្នាំ` : null]
    .filter(Boolean)
    .join(", ");
  return [
    { label: "លេខកូដអតិថិជន", value: val(c.ReadableCode) },
    {
      label: "ឈ្មោះអតិថិជន (ភេទ, អាយុ)",
      value: nameWithDetail ? `${val(c.fullNameKH)} (${nameWithDetail})` : val(c.fullNameKH),
    },
    { label: "លេខទំនាក់ទំនងគ្រួសារ", value: val(c.FOCTel || c.MOCTel) },
    { label: "អាសយដ្ឋានគ្រួសារ", value: familyAddress.value },
  ];
});

const plan = computed(() => {
  const r = rec.value;
  if (!r) return [];
  return [
    { label: "ស្ថាប័នទទួលផ្តល់សេវា", value: val(r.providerName) },
    { label: "ឈ្មោះបុគ្គលិកសង្គម", value: val(r.socialWorkerName) },
    { label: "លេខទំនាក់ទំនង ឬអ៊ីម៊ែល", value: val(r.socialWorkerPhone) },
    { label: "មូលហេតុនៃការបញ្ជូនទទួលសេវា", value: val(r.referralReason), wide: true },
    { label: "បញ្ហាប្រឈម", value: val(r.challenges), wide: true },
    { label: "ការវាយតម្លៃស្ថានភាពបច្ចុប្បន្ន", value: val(r.situationAssessment), wide: true },
  ];
});

const activities = computed(() => rec.value?.activities ?? []);

const monitoring = computed(() => {
  const r = rec.value;
  if (!r) return [];
  return [
    { label: "កាលបរិច្ឆេទតាមដាន", value: fmt(r.monitorDate) },
    { label: "វិធីសាស្រ្តតាមដាន", value: val(r.monitorMethod) },
    { label: "លទ្ធផល", value: val(r.monitorResult) },
    { label: "កាលបរិច្ឆេទតាមដានបន្ត", value: fmt(r.nextMonitorDate) },
  ];
});

useHead(() => ({ title: rec.value?.client?.fullNameKH || "ផែនការករណី" }));

async function load() {
  try {
    const data: any = await $fetch("/api/client/case-plan/get", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!data?.id) {
      error.value = "រកមិនឃើញផែនការនេះទេ";
      return;
    }
    rec.value = data;
  } catch (e: any) {
    error.value = e?.statusMessage || e?.message || "មិនអាចទាញយកព័ត៌មានបានទេ";
  } finally {
    pending.value = false;
  }
}
onMounted(load);
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">ផែនការករណីរបស់អតិថិជន</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="rec" :to="`/client/case-plan/form?id=${rec.id}`">
            <UButton color="gray" size="xl" :disabled="readOnly">
              <TwFeather type="edit-2" :size="18" class="mr-1" />
              <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.edit') }}</span>
            </UButton>
          </NuxtLink>
          <UButton v-if="rec" color="primary" size="xl" @click="printPage">
            <TwFeather type="printer" :size="18" class="mr-1" />
            <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.print') }}</span>
          </UButton>
        </div>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="grid grid-cols-12 gap-4">
        <div v-for="n in 3" :key="n"
          class="col-span-12 h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      </div>

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else-if="rec" class="grid grid-cols-12 items-start gap-4">
        <!-- ១. ព័ត៌មានអតិថិជន -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានអតិថិជន</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="f in clientFields" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ f.label }}
                <span class="ml-1 text-xs text-gray-400">(ទម្រង់ទី១)</span>
              </dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- ២. ផែនការ -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">ផែនការ</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div v-for="f in plan" :key="f.label" :class="(f as any).wide ? 'sm:col-span-3' : ''">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                {{ f.value }}
              </dd>
            </div>
          </dl>

          <!-- ក. សកម្មភាពសេវាកម្ម — numbered as the manual numbers them -->
          <h4 class="mt-6 text-lg font-[Moul] text-primary">ក. សកម្មភាពសេវាកម្ម</h4>
          <hr class="my-2 border dark:border-gray-700" />
          <p v-if="!activities.length" class="py-2 text-base text-gray-500 dark:text-gray-400">
            មិនទាន់មានសកម្មភាពសេវាកម្មនៅឡើយទេ។
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-2 pr-4 font-normal">ល.រ</th>
                  <th class="py-2 pr-4 font-normal">លេខកូដ</th>
                  <th class="py-2 pr-4 font-normal">ឈ្មោះសេវា</th>
                  <th class="py-2 pr-4 font-normal">កាលបរិច្ឆេទចាប់ផ្តើម</th>
                  <th class="py-2 font-normal">កាលបរិច្ឆេទបញ្ចប់</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="(a, i) in activities" :key="a.id">
                  <td class="py-2 pr-4 text-gray-500">{{ i + 1 }}</td>
                  <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ val(a.service?.code) }}</td>
                  <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ val(a.service?.nameKh) }}</td>
                  <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(a.startDate) }}</td>
                  <td class="py-2 text-gray-800 dark:text-gray-100">{{ fmt(a.endDate) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ៣. កាលបរិច្ឆេទតាមដាន ត្រួតពិនិត្យ -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">កាលបរិច្ឆេទតាមដាន ត្រួតពិនិត្យ</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div v-for="f in monitoring" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- ៤. សេចក្តីសន្និដ្ឋាន -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">សេចក្តីសន្និដ្ឋាន</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <p class="whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
            {{ val(rec.conclusion) }}
          </p>
        </section>

        <!-- The submit/approve half of ៤, as the shared panel -->
        <ApprovalPanel :record-id="rec.id" endpoint="/api/client/case-plan/approve" :status="rec.approvalStatus"
          :submitted-at="rec.submittedAt" :decided-at="rec.decidedAt" :rejection-reason="rec.rejectionReason"
          :can-decide="true" :read-only="readOnly" @changed="load" />
      </div>
    </div>
  </div>
</template>
