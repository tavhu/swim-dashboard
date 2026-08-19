<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * បញ្ជីការបញ្ជូន — every referral the caller may see, newest first.
 *
 * A list of its own rather than only a section inside each client, because a
 * referral is followed up across clients: "what have we sent out, and what is
 * still waiting" is a question about the queue, not about one case file.
 */
useHead({ title: tr("បញ្ជីការបញ្ជូន") });

const rows = ref<any[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);

const load = async () => {
  pending.value = true;
  try {
    const res: any = await $fetch("/api/client/referral/get", { method: "POST", body: {} });
    rows.value = res?.data ?? [];
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
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បញ្ជីការបញ្ជូន') }}</h2>
        <UButton color="gray" size="xl" :loading="pending" @click="load">
          <TwFeather type="refresh-cw" :size="18" class="mr-1" />
          <span class="font-[Moul] text-lg">{{ tr('ធ្វើបច្ចុប្បន្នភាព') }}</span>
        </UButton>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- A referral is raised from a client's own page, so an empty list says
           where to start rather than offering a create button with no client. -->
      <div v-else-if="!rows.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
        <TwFeather type="send" :size="34" class="mx-auto text-gray-400" />
        <p class="mt-3 text-lg text-gray-700 dark:text-gray-200">{{ tr('មិនទាន់មានការបញ្ជូនទេ') }}</p>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ tr('បង្កើតការបញ្ជូនចេញពីសំណុំឯកសារអតិថិជន') }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ tr('បញ្ជីអតិថិជន') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th class="px-4 py-3 font-semibold">{{ tr('អតិថិជន') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ប្រភេទសេវា/ជំនួយដែលស្នើសុំ') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('កម្រិតបន្ទាន់') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ស្ថានភាព') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('កាលបរិច្ឆេទ') }}</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 dark:border-gray-700">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <EntityAvatar :src="r.client?.photo" :alt="r.client?.fullNameKH ?? ''" kind="person" />
                  <div class="min-w-0">
                    <p class="truncate text-gray-800 dark:text-gray-100">{{ r.client?.fullNameKH ?? '—' }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ r.client?.ReadableCode }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-gray-800 dark:text-gray-100">{{ r.serviceType?.nameKh ?? '—' }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-sm" :class="(URGENCY[r.urgency] ?? URGENCY.ROUTINE).cls">
                  {{ (URGENCY[r.urgency] ?? URGENCY.ROUTINE).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-sm" :class="(APPROVAL[r.approvalStatus] ?? APPROVAL.DRAFT).cls">
                  {{ (APPROVAL[r.approvalStatus] ?? APPROVAL.DRAFT).label }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ fmt(r.createdAt) }}</td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="`/client/referral/view/${r.id}`">
                  <UButton color="primary" size="sm"><span class="font-[Moul]">{{ tr('មើល') }}</span></UButton>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
