<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * A client's ទម្រង់ទី២ episodes. Unlike form 1 there can be many per client —
 * one per episode of service — so the menu lands here rather than on a single
 * record, and creating, viewing and editing all start from this list.
 */
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();

const clientId = computed(() => route.params.clientId as string);
const client = ref<any>(null);
const rows = ref<any[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS: Record<string, { label: string; classes: string }> = {
  DRAFT: { label: "ព្រាង", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: "បានស្នើសុំ", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: "បានអនុម័ត", classes: "bg-primary/10 text-primary" },
  REJECTED: { label: "បានបដិសេធ", classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

useHead(() => ({ title: "ការប្រើសេវាកម្មរបស់អតិថិជន" }));

onMounted(async () => {
  try {
    const [c, list]: any = await Promise.all([
      $fetch("/api/client/personalInformationGet", { method: "POST", body: { id: clientId.value } }),
      $fetch("/api/client/service/get", { method: "POST", body: { clientId: clientId.value } }),
    ]);
    if (!c?.id) throw new Error(t('message.clientNotFound'));
    client.value = c;
    rows.value = list?.data ?? [];
  } catch (e: any) {
    error.value = e?.message || t('message.loadFailed');
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
          <h2 class="text-2xl font-[Moul] text-primary">ការប្រើសេវាកម្មរបស់អតិថិជន</h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink v-if="client" :to="`/client/service/form?client=${client.id}`">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">ចុះឈ្មោះថ្មី</span>
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
          មិនទាន់មានកំណត់ត្រាការប្រើសេវាកម្មនៅឡើយទេ។
        </p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-base">
            <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="py-3 pr-4 font-normal">ល.រ</th>
                <th class="py-3 pr-4 font-normal">កាលបរិច្ឆេទ</th>
                <th class="py-3 pr-4 font-normal">សេវាកម្ម</th>
                <th class="py-3 pr-4 font-normal">អ្នកផ្តល់សេវា</th>
                <th class="py-3 pr-4 font-normal">ស្ថានភាព</th>
                <th class="py-3 font-normal">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(r, i) in rows" :key="r.id">
                <td class="py-3 pr-4 text-gray-500">{{ i + 1 }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.serviceDate) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.service?.nameKh ?? '—' }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.providerName ?? '—' }}</td>
                <td class="py-3 pr-4">
                  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                    :class="(STATUS[r.approvalStatus] ?? STATUS.DRAFT).classes">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" />
                    {{ (STATUS[r.approvalStatus] ?? STATUS.DRAFT).label }}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex gap-2">
                    <NuxtLink :to="`/client/service/view/${r.id}`">
                      <UButton color="gray" icon="i-heroicons-eye" size="sm">{{ $t('action.view') }}</UButton>
                    </NuxtLink>
                    <NuxtLink :to="`/client/service/form?id=${r.id}`">
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
