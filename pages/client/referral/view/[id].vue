<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/** One ការបញ្ជូន, as it reads and as it prints. */
const route = useRoute();
const readOnly = checkIfPageReadOnly();
const { mayEdit } = useRecordPermissions("client-referral-form");

const rec = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

const load = async () => {
  pending.value = true;
  try {
    const data: any = await $fetch("/api/client/referral/get", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!data?.id) throw new Error("not found");
    rec.value = reviveDates(data);
  } catch (e: any) {
    error.value = apiErrorMessage(e, tr("មិនអាចទាញយកទិន្នន័យបានទេ"));
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const URGENCY: Record<string, { label: string; cls: string }> = {
  ROUTINE: { label: tr("ធម្មតា"), cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200" },
  URGENT: { label: tr("បន្ទាន់"), cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  EMERGENCY: { label: tr("អាសន្ន"), cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);
const fmt = (d?: any) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const attachments = computed(() =>
  String(rec.value?.attachments ?? "").split(",").map((s) => s.trim()).filter(Boolean)
);
const printPage = () => window.print();
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ការបញ្ជូន') }}</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="rec" :to="`/client/referral/form?id=${rec.id}`">
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

      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <div v-else-if="rec" class="grid grid-cols-12 gap-4">
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ព័ត៌មានអតិថិជន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខកូដអតិថិជន') }}</dt>
              <dd class="mt-1 text-base">{{ val(rec.client?.ReadableCode) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះអតិថិជន') }}</dt>
              <dd class="mt-1 text-base">{{ val(rec.client?.fullNameKH) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទំនាក់ទំនងគ្រួសារ') }}</dt>
              <dd class="mt-1 text-base">{{ val(rec.client?.FOCTel || rec.client?.MOCTel) }}</dd>
            </div>
          </dl>
        </section>

        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">
            {{ tr('មូលហេតុនៃការបញ្ជូន និងព័ត៌មានលម្អិតអំពីសេវា') }}
          </h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ប្រភេទសេវា/ជំនួយដែលស្នើសុំ') }}</dt>
              <dd class="mt-1 text-base">{{ val(rec.serviceType?.nameKh) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កម្រិតបន្ទាន់') }}</dt>
              <dd class="mt-1">
                <span class="rounded-full px-3 py-1 text-sm" :class="(URGENCY[rec.urgency] ?? URGENCY.ROUTINE).cls">
                  {{ (URGENCY[rec.urgency] ?? URGENCY.ROUTINE).label }}
                </span>
              </dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('មូលហេតុចម្បងនៃការបញ្ជូន') }}</dt>
              <dd class="mt-1 whitespace-pre-line text-base">{{ val(rec.primaryReason) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ស្ថានភាពបច្ចុប្បន្ន និងសាវតាពាក់ព័ន្ធ') }}</dt>
              <dd class="mt-1 whitespace-pre-line text-base">{{ val(rec.currentSituation) }}</dd>
            </div>
          </dl>
        </section>

        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ការយល់ព្រម និងឯកសារភ្ជាប់') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('បានទទួលការយល់ព្រមពីអតិថិជន') }}</dt>
              <dd class="mt-1 text-base">
                <span :class="rec.consentObtained ? 'text-primary' : 'text-red-600 dark:text-red-400'">
                  {{ rec.consentObtained ? tr('បាទ/ចាស') : tr('មិនទាន់') }}
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ហត្ថលេខា / សេចក្តីប្រកាស') }}</dt>
              <dd class="mt-1 text-base">{{ val(rec.signature) }}</dd>
            </div>
            <div class="sm:col-span-2">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឯកសារភ្ជាប់') }}</dt>
              <dd class="mt-1">
                <p v-if="!attachments.length" class="text-base text-gray-500">—</p>
                <ul v-else class="list-disc pl-5">
                  <li v-for="a in attachments" :key="a">
                    <a :href="a" target="_blank" class="text-primary underline">{{ a.split('/').pop() }}</a>
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <ApprovalPanel
          :record-id="rec.id"
          endpoint="/api/client/referral/approve"
          :status="rec.approvalStatus"
          :submitted-at="rec.submittedAt"
          :decided-at="rec.decidedAt"
          :rejection-reason="rec.rejectionReason"
          :submitted-by-name="rec.submittedByName"
          :decided-by-name="rec.decidedByName"
          :can-decide="true"
          :can-submit="mayEdit"
          @changed="load"
        />
      </div>
    </div>
  </div>
</template>
