<script setup lang="ts">
import { mayStartForm } from "~~/shared/formPipeline";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * A client's ទម្រង់ទី៤ records. Many per client, as the other episode forms are.
 */
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();
const toast = useToast();

const clientId = computed(() => route.params.clientId as string);

const client = ref<any>(null);
/**
 * ទម្រង់ទី៤ may only be started once the form before it has been sent for
 * approval. The list menu on /client already greys this out; this page is
 * reachable from that menu and was offering the same form regardless, so the
 * check belongs here too. Same shared function, same answer.
 */
const mayStart = computed(
  () => !client.value?.pipeline || mayStartForm(client.value.pipeline, 4)
);

const rows = ref<any[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS: Record<string, { label: string; classes: string }> = {
  DRAFT: { label: tr("ព្រាង"), classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: tr("បានស្នើសុំ"), classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: tr("បានអនុម័ត"), classes: "bg-primary/10 text-primary" },
  REJECTED: { label: tr("បានបដិសេធ"), classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

useHead(() => ({ title: tr("សមាហរណកម្ម") }));

onMounted(async () => {
  try {
    const [c, list]: any = await Promise.all([
      $fetch("/api/client/personalInformationGet", { method: "POST", body: { id: clientId.value } }),
      $fetch("/api/client/reintegration/get", { method: "POST", body: { clientId: clientId.value } }),
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

/**
 * Removes one ទម្រង់ទី៤ record. The row is the whole episode — the shared endpoint
 * takes its approval history and its uploaded files with it, so the confirmation
 * says as much rather than asking a bare "are you sure?".
 *
 * $fetch, not useFetch: this runs from a click handler, where useFetch is
 * unreliable, and the response body is wanted for the toast.
 */
const removeRecord = async (r: any, i: number) => {
  if (readOnly) return;
  if (!(await confirmDelete(
    `លុបកំណត់ត្រាសមាហរណកម្ម ថ្ងៃទី ${fmt(r.handoverDate)} រួមទាំងបញ្ជីសេវា និងឯកសារភ្ជាប់។`
  ))) return;

  try {
    await $fetch("/api/client/reintegration/delete", { method: "POST", body: { id: r.id } });
    rows.value.splice(i, 1);
    toast.success({ message: t('message.saved') });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t('message.notSaved'))});
  }
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('សមាហរណកម្ម') }}</h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink v-if="client && mayStart" :to="`/client/reintegration/form?client=${client.id}`">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.createNew') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <p v-if="client && !mayStart"
        class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        {{ tr('ត្រូវបំពេញ និងស្នើសុំការអនុម័តទម្រង់មុនជាមុនសិន') }}
      </p>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else class="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <p v-if="!rows.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">{{ tr('មិនទាន់មានសមាហរណកម្មនៅឡើយទេ។') }}</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-base">
            <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="py-3 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('កាលបរិច្ឆេទបង្កើត') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('កាលបរិច្ឆេទទទួល') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('អ្នកទទួល') }}</th>
                <!-- Named columns, not "សកម្មភាព": the last column is already
                     called that, and two identical headers meaning different
                     things is worse than longer labels. -->
                <th class="py-3 pr-4 font-normal">{{ tr('សេវាកន្លងមក') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('សេវាបន្ត') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('ស្ថានភាព') }}</th>
                <th class="py-3 font-normal">{{ tr('សកម្មភាព') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="(r, i) in rows" :key="r.id">
                <td class="py-3 pr-4 text-gray-500">{{ i + 1 }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.createdAt) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ fmt(r.handoverDate) }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.recipient ?? '—' }}</td>
                <!-- Counts, because knowing a record has no services is worth
                     seeing without opening it. -->
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.pastServices?.length ?? 0 }}</td>
                <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ r.communityServices?.length ?? 0 }}</td>
                <td class="py-3 pr-4">
                  <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
                    :class="(STATUS[r.approvalStatus] ?? STATUS.DRAFT).classes">
                    <span class="h-1.5 w-1.5 rounded-full bg-current" />
                    {{ (STATUS[r.approvalStatus] ?? STATUS.DRAFT).label }}
                  </span>
                </td>
                <td class="py-3">
                  <div class="flex gap-2">
                    <NuxtLink :to="`/client/reintegration/view/${r.id}`">
                      <UButton color="gray" icon="i-heroicons-eye" size="sm">{{ $t('action.view') }}</UButton>
                    </NuxtLink>
                    <NuxtLink :to="`/client/reintegration/form?id=${r.id}`">
                      <UButton color="primary" icon="i-heroicons-pencil-square" size="sm" :disabled="readOnly">{{ tr('កែសម្រួល') }}</UButton>
                    </NuxtLink>
                    <UButton color="red" icon="i-heroicons-trash" size="sm" :disabled="readOnly"
                      @click="removeRecord(r, i)">{{ tr('លុបចេញ') }}</UButton>
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
