<script setup lang="ts">
import { mayStartForm } from "~~/shared/formPipeline";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * A client's ទម្រង់ទី២ episodes. Unlike form 1 there can be many per client —
 * one per episode of service — so the menu lands here rather than on a single
 * record, and creating, viewing and editing all start from this list.
 */
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();
const toast = useToast();

const clientId = computed(() => route.params.clientId as string);

const client = ref<any>(null);
/**
 * ទម្រង់ទី២ may only be started once the form before it has been sent for
 * approval. The list menu on /client already greys this out; this page is
 * reachable from that menu and was offering the same form regardless, so the
 * check belongs here too. Same shared function, same answer.
 */
const mayStart = computed(
  () => !client.value?.pipeline || mayStartForm(client.value.pipeline, 2)
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

useHead(() => ({ title: tr("ការប្រើសេវាកម្មរបស់អតិថិជន") }));

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

/**
 * Removes one ទម្រង់ទី២ record. The row is the whole episode — the shared endpoint
 * takes its approval history and its uploaded files with it, so the confirmation
 * says as much rather than asking a bare "are you sure?".
 *
 * $fetch, not useFetch: this runs from a click handler, where useFetch is
 * unreliable, and the response body is wanted for the toast.
 */
const removeRecord = async (r: any, i: number) => {
  if (readOnly) return;
  if (!(await confirmDelete(
    `លុបកំណត់ត្រាការប្រើសេវាកម្ម ថ្ងៃទី ${fmt(r.serviceDate)} រួមទាំងឯកសារភ្ជាប់។`
  ))) return;

  try {
    await $fetch("/api/client/service/delete", { method: "POST", body: { id: r.id } });
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
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ការប្រើសេវាកម្មរបស់អតិថិជន') }}</h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink v-if="client && mayStart" :to="`/client/service/form?client=${client.id}`">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ tr('ចុះឈ្មោះថ្មី') }}</span>
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
        <p v-if="!rows.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">{{ tr('មិនទាន់មានកំណត់ត្រាការប្រើសេវាកម្មនៅឡើយទេ។') }}</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-base">
            <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="py-3 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('កាលបរិច្ឆេទ') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('សេវាកម្ម') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('អ្នកផ្តល់សេវា') }}</th>
                <th class="py-3 pr-4 font-normal">{{ tr('ស្ថានភាព') }}</th>
                <th class="py-3 font-normal">{{ tr('សកម្មភាព') }}</th>
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
