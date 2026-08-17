<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ទម្រង់ទី៦ read view.
 *
 * Only the reason group this closure was is rendered. ៣. កំណត់សម្គាល់ is printed
 * from the manual's own words rather than read off the record — it is the same
 * text on every closure and is not stored.
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

const successful = computed(() => rec.value?.outcome === "SUCCESSFUL");
const outcome = computed(() => CLOSURE_OUTCOME.find((o) => o.value === rec.value?.outcome));

const clientAge = computed(() => ageFrom(rec.value?.client?.DOB));

const familyAddress = computed(() => {
  const c = rec.value?.client;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

const clientFields = computed(() => {
  const c = rec.value?.client;
  if (!c) return [];
  const detail = [c.Gender, clientAge.value !== null ? `${clientAge.value} ឆ្នាំ` : null].filter(Boolean).join(", ");
  return [
    { label: "លេខកូដអតិថិជន", value: val(c.ReadableCode) },
    { label: "ឈ្មោះអតិថិជន (ភេទ, អាយុ)", value: detail ? `${val(c.fullNameKH)} (${detail})` : val(c.fullNameKH) },
    { label: "លេខទូរស័ព្ទទំនាក់ទំនងគ្រួសារ", value: val(c.FOCTel || c.MOCTel) },
    { label: "អាសយដ្ឋានគ្រួសារ", value: familyAddress.value },
  ];
});

/** ក reads as one line; ខ as the list that was ticked. */
const successReasonText = computed(() => {
  const r = rec.value;
  if (!r?.successReason) return "—";
  return r.successReason === CLOSURE_REASON_OTHER && r.successReasonOther
    ? `${r.successReason}: ${r.successReasonOther}`
    : r.successReason;
});

const failureList = computed(() =>
  String(rec.value?.failureReasons ?? "").split(",").map((s: string) => s.trim()).filter(Boolean)
);

const centreSummary = computed(() =>
  CLOSURE_SUMMARY_FIELDS.map((f) => ({ label: f.label, value: val(rec.value?.[`centre${f.key}`]) }))
);
const communitySummary = computed(() =>
  CLOSURE_SUMMARY_FIELDS.map((f) => ({ label: f.label, value: val(rec.value?.[`community${f.key}`]) }))
);

useHead(() => ({ title: rec.value?.client?.fullNameKH || "ការបិទករណី" }));

async function load() {
  try {
    const data: any = await $fetch("/api/client/case-closure/get", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!data?.id) {
      error.value = "រកមិនឃើញកំណត់ត្រានេះទេ";
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
        <h2 class="text-2xl font-[Moul] text-primary">បិទករណី</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="rec" :to="`/client/case-closure/form?id=${rec.id}`">
            <UButton color="gray" size="xl" :disabled="readOnly">
              <TwFeather type="edit-2" :size="18" class="mr-1" />
              <span class="hidden font-[Moul] text-lg sm:inline">កែសម្រួល</span>
            </UButton>
          </NuxtLink>
          <UButton v-if="rec" color="primary" size="xl" @click="printPage">
            <TwFeather type="printer" :size="18" class="mr-1" />
            <span class="hidden font-[Moul] text-lg sm:inline">បោះពុម្ព</span>
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
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">ត្រឡប់ក្រោយ</span></UButton>
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
                {{ f.label }} <span class="ml-1 text-xs text-gray-400">(ទម្រង់ទី១)</span>
              </dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- ២. មូលហេតុនៃការបិទករណី -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">មូលហេតុនៃការបិទករណី ឬបញ្ចេញពីមជ្ឈមណ្ឌល</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">លទ្ធផល</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ outcome?.label ?? '—' }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-gray-500 dark:text-gray-400">មូលហេតុ</dt>
              <dd v-if="successful" class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">
                {{ successReasonText }}
              </dd>
              <dd v-else class="mt-1">
                <ul v-if="failureList.length" class="list-inside list-disc space-y-1">
                  <li v-for="r in failureList" :key="r" class="break-words text-base text-gray-800 dark:text-gray-100">
                    {{ r }}
                  </li>
                </ul>
                <span v-else class="text-base text-gray-800 dark:text-gray-100">—</span>
              </dd>
            </div>
          </dl>
        </section>

        <!-- ៣. កំណត់សម្គាល់ — the manual's words, part of the printed form -->
        <section class="print-block col-span-12 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
          <h3 class="text-xl font-[Moul] text-primary">កំណត់សម្គាល់</h3>
          <p class="mt-2 text-base text-gray-700 dark:text-gray-200">{{ CLOSURE_STABILITY_NOTE.intro }}</p>
          <ul class="mt-2 list-inside list-disc space-y-1">
            <li v-for="(p, i) in CLOSURE_STABILITY_NOTE.points" :key="i"
              class="text-base leading-relaxed text-gray-700 dark:text-gray-200">
              {{ p }}
            </li>
          </ul>
        </section>

        <!-- ៤. សេចក្តីសង្ខេបសន្និដ្ឋាន -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">សេចក្តីសង្ខេបសន្និដ្ឋាន</h3>
          <hr class="my-2 border dark:border-gray-700" />

          <h4 class="text-lg font-[Moul] text-primary">ក. ករណីសិក្សាមណ្ឌល</h4>
          <dl class="mt-2 grid grid-cols-1 gap-x-8 gap-y-4 2xl:grid-cols-3">
            <div v-for="f in centreSummary" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                {{ f.value }}
              </dd>
            </div>
          </dl>

          <h4 class="mt-6 text-lg font-[Moul] text-primary">ខ. ករណីសិក្សានៅសហគមន៍</h4>
          <dl class="mt-2 grid grid-cols-1 gap-x-8 gap-y-4 2xl:grid-cols-3">
            <div v-for="f in communitySummary" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                {{ f.value }}
              </dd>
            </div>
          </dl>

          <div class="mt-6">
            <dt class="text-sm text-gray-500 dark:text-gray-400">គ. គម្រោងអនាគតរបស់ជនរងគ្រោះគួទទួលបាន</dt>
            <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
              {{ val(rec.futurePlan) }}
            </dd>
          </div>
        </section>

        <ApprovalPanel :record-id="rec.id" endpoint="/api/client/case-closure/approve" :status="rec.approvalStatus"
          :submitted-at="rec.submittedAt" :decided-at="rec.decidedAt" :rejection-reason="rec.rejectionReason"
          :can-decide="true" :read-only="readOnly" @changed="load" />
      </div>
    </div>
  </div>
</template>
