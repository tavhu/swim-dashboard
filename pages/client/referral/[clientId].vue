<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";

/** One client's referrals, and where a new one is raised from. */
const route = useRoute();
const toast = useToast();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();
const { mayEdit } = useRecordPermissions("client-referral-form");

const clientId = computed(() => route.params.clientId as string);
const client = ref<any>(null);
const rows = ref<any[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const load = async () => {
  pending.value = true;
  try {
    const [c, list]: any = await Promise.all([
      $fetch("/api/client/personalInformationGet", { method: "POST", body: { id: clientId.value } }),
      $fetch("/api/client/referral/get", { method: "POST", body: { clientId: clientId.value } }),
    ]);
    client.value = c;
    rows.value = list?.data ?? [];
  } catch (e: any) {
    error.value = apiErrorMessage(e, tr("មិនអាចទាញយកទិន្នន័យបានទេ"));
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const remove = async (r: any) => {
  if (!(await confirmDelete(r.serviceType?.nameKh ?? tr("ការបញ្ជូន")))) return;
  try {
    await $fetch("/api/client/referral/delete", { method: "POST", body: { id: r.id } });
    toast.success({ message: t("message.deleted") });
    await load();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  }
};

const APPROVAL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: tr("ព្រាង"), cls: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: tr("បានស្នើសុំ"), cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: tr("បានអនុម័ត"), cls: "bg-primary/10 text-primary" },
  REJECTED: { label: tr("បានបដិសេធ"), cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};
const fmt = (d?: any) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ការបញ្ជូន') }}</h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink v-if="client && mayEdit" :to="`/client/referral/form?client=${client.id}`">
          <UButton color="primary" size="xl">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.createNew') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
      </div>
      <div v-else-if="!rows.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
        <p class="text-gray-600 dark:text-gray-300">{{ tr('មិនទាន់មានការបញ្ជូនទេ') }}</p>
      </div>

      <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th class="px-4 py-3 font-semibold">{{ tr('ប្រភេទសេវា/ជំនួយដែលស្នើសុំ') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ស្ថានភាព') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('កាលបរិច្ឆេទ') }}</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 dark:border-gray-700">
              <td class="px-4 py-3 text-gray-800 dark:text-gray-100">{{ r.serviceType?.nameKh ?? '—' }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-sm" :class="(APPROVAL[r.approvalStatus] ?? APPROVAL.DRAFT).cls">
                  {{ (APPROVAL[r.approvalStatus] ?? APPROVAL.DRAFT).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ fmt(r.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <NuxtLink :to="`/client/referral/view/${r.id}`">
                    <UButton color="primary" size="sm"><span class="font-[Moul]">{{ tr('មើល') }}</span></UButton>
                  </NuxtLink>
                  <UButton v-if="!readOnly && mayEdit" color="red" size="sm" @click="remove(r)">
                    <TwFeather type="trash-2" :size="14" />
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
