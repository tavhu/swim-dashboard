<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * A client's ទម្រង់ទី៥ visits. Many per client — this is the form that records
 * each follow-up as it happens.
 */
const route = useRoute();
const readOnly = checkIfPageReadOnly();

const clientId = computed(() => route.params.clientId as string);
const client = ref<any>(null);
const rows = ref<any[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const stageLabel = (v?: string | null) =>
  FOLLOW_UP_STAGE.find((s) => s.value === v)?.label ?? "—";

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS: Record<string, { label: string; classes: string }> = {
  DRAFT: { label: "ព្រាង", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: "បានស្នើសុំ", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: "បានអនុម័ត", classes: "bg-primary/10 text-primary" },
  REJECTED: { label: "បានបដិសេធ", classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

useHead(() => ({ title: "ការតាមដាន និងវាយតម្លៃ" }));

onMounted(async () => {
  try {
    const [c, list]: any = await Promise.all([
      $fetch("/api/client/personalInformationGet", { method: "POST", body: { id: clientId.value } }),
      $fetch("/api/client/follow-up/get", { method: "POST", body: { clientId: clientId.value } }),
    ]);
    if (!c?.id) throw new Error("រកមិនឃើញអតិថិជននេះទេ");
    client.value = c;
    rows.value = list?.data ?? [];
  } catch (e: any) {
    error.value = e?.message || "មិនអាចទាញយកព័ត៌មានបានទេ";
  } finally {
    pending.value = false;
  }
});
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">ការតាមដាន និងវាយតម្លៃ</h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink v-if="client" :to="`/client/follow-up/form?client=${client.id}`">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.createNew') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <p v-if="!rows.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
          មិនទាន់មានការតាមដាន និងវាយតម្លៃនៅឡើយទេ។
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-base">
            <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="py-3 pr-4 font-normal">ល.រ</th>
                <th class="py-3 pr-4 font-normal">កាលបរិច្ឆេទបង្កើត</th>
                <th class="py-3 pr-4 font-normal">កាលបរិច្ឆេទតាមដាន</th>
                <!-- Which of the manual's two sections this visit was. -->
                <th class="py-3 pr-4 font-normal">ប្រភេទ</th>
                <th class="py-3 pr-4 font-normal">វិធីសាស្រ្ត</th>
                <th class="py-3 pr-4 font-normal">តាមដានបន្ត</th>
                <th class="py-3 pr-4 font-normal">ស្ថានភាព</th>
                <th class="py-3 font-normal">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(r, i) in rows" :key="r.id">
                <td class="py-3 pr-4 text-gray-500">{{ i + 1 }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.createdAt) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.monitorDate) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ stageLabel(r.stage) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.monitorMethod ?? '—' }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.nextMonitorDate) }}</td>
                <td class="py-3 pr-4">
                  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                    :class="(STATUS[r.approvalStatus] ?? STATUS.DRAFT).classes">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" />
                    {{ (STATUS[r.approvalStatus] ?? STATUS.DRAFT).label }}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex gap-2">
                    <NuxtLink :to="`/client/follow-up/view/${r.id}`">
                      <UButton color="gray" icon="i-heroicons-eye" size="sm">{{ $t('action.view') }}</UButton>
                    </NuxtLink>
                    <NuxtLink :to="`/client/follow-up/form?id=${r.id}`">
                      <UButton color="primary" icon="i-heroicons-pencil-square" size="sm" :disabled="readOnly">
                        កែសម្រួល
                      </UButton>
                    </NuxtLink>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
