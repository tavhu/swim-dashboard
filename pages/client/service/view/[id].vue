<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ទម្រង់ទី២ read view — same shell and print stylesheet as the client case file,
 * so បោះពុម្ព produces a black-on-white document through the browser's own Save
 * as PDF. The approval block is the shared panel, not a copy.
 */
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();

const rec = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const printPage = () => window.print();

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

const yesNo = (v: boolean | null | undefined, yes: string, no: string) =>
  v === true ? yes : v === false ? no : "—";

const diagnosis = computed(() => {
  const r = rec.value; if (!r) return [];
  return [
    { label: tr("ប្រភេទអតិថិជន"), value: val(r.clientType?.nameKh) },
    { label: tr("មូលហេតុ"), value: val(r.reason) },
    // The manual asks these two here. They are answered on ទម្រង់ទី១, so they
    // are shown from there rather than asked again — marked so a reader knows
    // where the answer came from.
    { label: tr("ធ្លាប់ទទួលសេវាពីមុន"), value: yesNo(r.client?.UsedtoRehab, "ធ្លាប់", "មិនធ្លាប់"), fromForm1: true },
    { label: tr("ចំនួនលើករួមទាំងលើកនេះ"), value: val(r.client?.HowManyTimeHaveServed), fromForm1: true },
    { label: tr("អនុម័តរោគវិនិច្ឆ័យដោយ"), value: val(r.diagnosisApprovedBy) },
    { label: tr("សន្និដ្ឋាន"), value: val(r.conclusion), wide: true },
  ];
});

/** បើធ្លាប់ តើមជ្ឈមណ្ឌលណាខ្លះ — the centres recorded on ទម្រង់ទី១. */
const previousCentres = computed(() => rec.value?.client?.ClientServeHistory ?? []);

const service = computed(() => {
  const r = rec.value; if (!r) return [];
  return [
    { label: tr("ថ្ងៃខែឆ្នាំមកទទួលសេវាកម្ម"), value: fmt(r.serviceDate) },
    { label: tr("សេវាកម្ម"), value: val(r.service?.nameKh) },
  ];
});

/** Stored as comma-separated paths, as CenterPlan.filePath does. */
const attachments = computed(() =>
  String(rec.value?.attachments ?? "").split(",").map((f: string) => f.trim()).filter(Boolean)
);

const provider = computed(() => {
  const r = rec.value; if (!r) return [];
  return [
    { label: tr("ឈ្មោះស្ថាប័នផ្តល់សេវា"), value: val(r.providerName) },
    { label: tr("ទីតាំងផ្តល់សេវា"), value: val(r.providerLocation) },
    { label: tr("ឈ្មោះភ្នាក់ងារផ្តល់សេវា"), value: val(r.providerAgent) },
    { label: tr("លេខទំនាក់ទំនង"), value: val(r.providerPhone) },
    { label: tr("ស្ថានភាពអតិថិជនបច្ចុប្បន្ន"), value: val(r.currentStatus) },
    { label: tr("តម្រូវការសេវាបន្ត"), value: val(r.followUpService?.nameKh) },
  ];
});

useHead(() => ({ title: rec.value?.client?.fullNameKH || "ការប្រើសេវាកម្ម" }));

async function load() {
  try {
    const data: any = await $fetch("/api/client/service/get", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!data?.id) { error.value = t('message.recordNotFound'); return; }
    rec.value = data;
  } catch (e: any) {
    error.value = e?.statusMessage || e?.message || t('message.loadFailed');
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
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ការប្រើសេវាកម្មរបស់អតិថិជន') }}</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="rec" :to="`/client/service/form?id=${rec.id}`">
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
        <div v-for="n in 3" :key="n" class="col-span-12 h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      </div>

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else-if="rec" class="grid grid-cols-12 items-start gap-4">
        <!-- Client header, read through the relation -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ព័ត៌មានអតិថិជន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខកូដអតិថិជន') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ val(rec.client?.ReadableCode) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះអតិថិជន') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ val(rec.client?.fullNameKH) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទំនាក់ទំនងគ្រួសារ') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ val(rec.client?.FOCTel || rec.client?.MOCTel) }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="previousCentres.length || attachments.length"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('មជ្ឈមណ្ឌលពីមុន និងឯកសារពាក់ព័ន្ធ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />

          <div v-if="previousCentres.length" class="mb-4">
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('បើធ្លាប់ តើមជ្ឈមណ្ឌលណាខ្លះ') }}<span class="text-xs text-gray-400">{{ tr('(ទម្រង់ទី១)') }}</span>
            </p>
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-2 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                  <th class="py-2 pr-4 font-normal">{{ tr('មជ្ឈមណ្ឌល ឬពន្ធនាគារ') }}</th>
                  <th class="py-2 font-normal">{{ tr('កាលបរិច្ឆេទ') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="(h, i) in previousCentres" :key="h.id">
                  <td class="py-2 pr-4 text-gray-500">{{ i + 1 }}</td>
                  <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ val(h.nameCenterorPrison) }}</td>
                  <td class="py-2 text-gray-800 dark:text-gray-100">{{ fmt(h.DateTimeServed) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="attachments.length">
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('ឯកសារពាក់ព័ន្ធ') }}</p>
            <ul class="space-y-1">
              <li v-for="path in attachments" :key="path">
                <a :href="`/${path}`" target="_blank" rel="noopener"
                  class="break-all text-base text-primary hover:underline">{{ path.split('/').pop() }}</a>
              </li>
            </ul>
          </div>
        </section>

        <section v-for="group in [
          { title: tr('ព័ត៌មានរោគឬសញ្ញាណវិនិច្ឆ័យ'), fields: diagnosis },
          { title: tr('ព័ត៌មានសេវាកម្មដែលត្រូវការប្រើ'), fields: service },
          { title: tr('អ្នកផ្តល់សេវា និងស្ថានភាពបច្ចុប្បន្ន'), fields: provider },
        ]" :key="group.title"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ group.title }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div v-for="f in group.fields" :key="f.label" :class="(f as any).wide ? 'sm:col-span-2' : ''">
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ tr(f.label) }}
                <span v-if="(f as any).fromForm1" class="ml-1 text-xs text-gray-400">{{ tr('(ទម្រង់ទី១)') }}</span>
              </dt>
              <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                {{ f.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- ៥. សិទ្ធិអនុម័ត — the shared panel, reloading the record after a decision -->
        <ApprovalPanel :record-id="rec.id" endpoint="/api/client/service/approve" :status="rec.approvalStatus"
          :submitted-at="rec.submittedAt" :decided-at="rec.decidedAt" :rejection-reason="rec.rejectionReason"
          :can-decide="true" :read-only="readOnly" @changed="load" />
      </div>
    </div>
  </div>
</template>
