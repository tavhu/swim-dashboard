<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ទម្រង់ទី៥ read view.
 *
 * Only the section this visit actually was is rendered — the manual asks the
 * user to choose ២ or ៣, so printing both, one of them empty, would be printing
 * a form the visit was not.
 */
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();
// កែសម្រួល and ស្នើសុំ belong to the form's edit resource, not to this view
// page's — see composables/recordPermissions.ts.
const { mayEdit } = useRecordPermissions('client-follow-up-form');

const rec = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const printPage = () => window.print();

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

const inCentre = computed(() => rec.value?.stage === "IN_CENTRE");
const stage = computed(() => FOLLOW_UP_STAGE.find((s) => s.value === rec.value?.stage));

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
  const detail = [c.Gender, clientAge.value !== null ? `${clientAge.value} ${tr('ឆ្នាំ')}` : null].filter(Boolean).join(", ");
  return [
    { label: tr("លេខកូដអតិថិជន"), value: val(c.ReadableCode) },
    { label: tr("ឈ្មោះអតិថិជន (ភេទ, អាយុ)"), value: detail ? `${val(c.fullNameKH)} (${detail})` : val(c.fullNameKH) },
    { label: tr("លេខទូរស័ព្ទទំនាក់ទំនងគ្រួសារ"), value: val(c.FOCTel || c.MOCTel) },
    { label: tr("អាសយដ្ឋានគ្រួសារ"), value: familyAddress.value },
  ];
});

const monitoring = computed(() => {
  const r = rec.value;
  if (!r) return [];
  const rows = [
    { label: tr("កាលបរិច្ឆេទតាមដាន"), value: fmt(r.monitorDate) },
    { label: tr("វិធីសាស្រ្តតាមដាន"), value: val(r.monitorMethod) },
    { label: tr("កាលបរិច្ឆេទតាមដានបន្ត"), value: fmt(r.nextMonitorDate) },
  ];
  // Section ៣ carries a result for the visit; section ២ records one per service.
  if (!inCentre.value) {
    rows.splice(2, 0, { label: tr("លទ្ធផល"), value: val(r.monitorResult) });
    rows.push({
      label: tr("អ្នកផ្តល់ព័តមាន"),
      value: val(String(r.informants ?? "").split(",").filter(Boolean).join(", ")),
    });
  }
  return rows;
});

const attachments = computed(() =>
  String(rec.value?.attachments ?? "").split(",").map((f: string) => f.trim()).filter(Boolean)
);

useHead(() => ({ title: rec.value?.client?.fullNameKH || "ការតាមដាន និងវាយតម្លៃ" }));

async function load() {
  try {
    const data: any = await $fetch("/api/client/follow-up/get", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!data?.id) {
      error.value = t('message.recordNotFound');
      return;
    }
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
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន') }}</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="rec" :to="`/client/follow-up/form?id=${rec.id}`">
            <UButton color="gray" size="xl" :disabled="!mayEdit">
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
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ព័ត៌មានអតិថិជន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="f in clientFields" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ tr(f.label) }} <span class="ml-1 text-xs text-gray-400">{{ tr('(ទម្រង់ទី១)') }}</span>
              </dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Whichever of ២ or ៣ this visit was -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ stage?.label ?? 'ការតាមដាន' }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ stage?.hint }}</p>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="f in monitoring" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr(f.label) }}</dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>

          <template v-if="inCentre">
            <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('សេវាកម្មដែលកំពុងតាមដាន') }}</h4>
            <hr class="my-2 border dark:border-gray-700" />
            <p v-if="!rec.services?.length" class="py-2 text-base text-gray-500 dark:text-gray-400">{{ tr('មិនទាន់មានទេ។') }}</p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-base">
                <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="py-2 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ tr('លេខកូដ') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ tr('ឈ្មោះសេវា') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ tr('ចាប់ផ្តើម') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ tr('បញ្ចប់') }}</th>
                    <th class="py-2 font-normal">{{ tr('លទ្ធផល') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="(a, i) in rec.services" :key="a.id">
                    <td class="py-2 pr-4 text-gray-500">{{ i + 1 }}</td>
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ val(a.service?.code) }}</td>
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ val(a.service?.nameKh) }}</td>
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(a.startDate) }}</td>
                    <td class="py-2 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(a.endDate) }}</td>
                    <td class="py-2 text-gray-800 dark:text-gray-100">{{ val(a.outcome) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <div v-if="attachments.length" class="mt-4">
            <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('ឯកសារពាក់ព័ន្ធ') }}</p>
            <ul class="space-y-1">
              <li v-for="path in attachments" :key="path">
                <a :href="`/${path}`" target="_blank" rel="noopener"
                  class="break-all text-base text-primary hover:underline">{{ path.split('/').pop() }}</a>
              </li>
            </ul>
          </div>
        </section>

        <!-- ៤. សេចក្តីសន្និដ្ឋាន -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('សេចក្តីសន្និដ្ឋាន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <p class="whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
            {{ val(rec.conclusion) }}
          </p>
        </section>

        <ApprovalPanel :record-id="rec.id" endpoint="/api/client/follow-up/approve" :status="rec.approvalStatus"
          :submitted-at="rec.submittedAt" :decided-at="rec.decidedAt" :rejection-reason="rec.rejectionReason"
          :submitted-by-name="rec.submittedByName" :decided-by-name="rec.decidedByName"
          :can-decide="true" :can-submit="mayEdit" @changed="load" />
      </div>
    </div>
  </div>
</template>
