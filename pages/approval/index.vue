<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ការអនុម័ត — everything waiting on this approver, across all six ទម្រង់.
 *
 * The approval right existed before this page did, which meant the work it
 * grants was only reachable by going to look for it: open the client list, open
 * a client, open each form, see whether anything is amber. A director with a
 * centre's worth of cases had no way to answer "what is waiting on me?" short
 * of checking every record.
 *
 * Oldest first, because the thing that matters about a queue is what has been
 * waiting longest — not what arrived last, which is what a createdAt sort would
 * have shown.
 */
useHead({ title: tr("ការអនុម័ត") });

const rows = ref<any[]>([]);
const byForm = ref<{ form: number; count: number }[]>([]);
const pending = ref(true);
const error = ref<string | null>(null);
const formFilter = ref<number | null>(null);

const load = async () => {
  pending.value = true;
  error.value = null;
  try {
    const res: any = await $fetch("/api/approval/pending", { method: "POST" });
    rows.value = res?.data ?? [];
    byForm.value = res?.byForm ?? [];
  } catch (e: any) {
    error.value = apiErrorMessage(e, tr("មិនអាចទាញយកទិន្នន័យបានទេ"));
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const shown = computed(() =>
  formFilter.value === null ? rows.value : rows.value.filter((r) => r.form === formFilter.value)
);

/**
 * How long it has been waiting.
 *
 * The number of days, not a date, because that is the question an approver is
 * actually asking — a date makes them do the arithmetic themselves, once per row.
 */
const waiting = (iso?: string | null) => {
  if (!iso) return { text: "—", urgent: false };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return { text: tr("ថ្ងៃនេះ"), urgent: false };
  return { text: `${days} ${tr("ថ្ងៃ")}`, urgent: days >= 7 };
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ការអនុម័ត') }}</h2>
          <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ tr('ទម្រង់ដែលកំពុងរង់ចាំការសម្រេច') }}
          </p>
        </div>
        <UButton color="gray" size="xl" :loading="pending" @click="load">
          <TwFeather type="refresh-cw" :size="18" class="mr-1" />
          <span class="font-[Moul] text-lg">{{ tr('ធ្វើបច្ចុប្បន្នភាព') }}</span>
        </UButton>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <!-- Where the backlog is. Doubles as the filter, so the count and the way
           to act on it are the same control rather than two. -->
      <div class="mb-4 flex flex-wrap gap-2">
        <button
          class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition"
          :class="formFilter === null
            ? 'border-primary bg-primary text-white'
            : 'border-gray-300 text-gray-600 hover:border-primary dark:border-gray-700 dark:text-gray-300'"
          @click="formFilter = null"
        >
          {{ tr('ទាំងអស់') }} ({{ rows.length }})
        </button>
        <button
          v-for="f in byForm"
          :key="f.form"
          :disabled="!f.count"
          class="rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-40"
          :class="formFilter === f.form
            ? 'border-primary bg-primary text-white'
            : 'border-gray-300 text-gray-600 hover:border-primary dark:border-gray-700 dark:text-gray-300'"
          @click="formFilter = f.form"
        >
          {{ f.label }} {{ tr(f.nameKh) }} ({{ f.count }})
        </button>
      </div>

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- An empty queue is good news, so it says so rather than showing the
           blank table an officer would read as a failure to load. -->
      <div v-else-if="!shown.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
        <TwFeather type="check-circle" :size="34" class="mx-auto text-primary" />
        <p class="mt-3 text-lg text-gray-700 dark:text-gray-200">{{ tr('គ្មានទម្រង់រង់ចាំការអនុម័តទេ') }}</p>
      </div>

      <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th class="px-4 py-3 font-semibold">{{ tr('ទម្រង់') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('អតិថិជន') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ស្នើឡើងដោយ') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('កាលបរិច្ឆេទស្នើ') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('រង់ចាំ') }}</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in shown"
              :key="`${r.recordType}-${r.id}`"
              class="border-b text-gray-800 last:border-0 dark:border-gray-700 dark:text-gray-100"
            >
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-2">
                  <span class="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-[11px] text-white">
                    {{ r.formLabel }}
                  </span>
                  <span class="text-sm">{{ tr(r.formNameKh) }}</span>
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <EntityAvatar :src="r.clientPhoto" :alt="r.clientName ?? ''" kind="person" />
                  <div class="min-w-0">
                    <p class="truncate">{{ r.clientName ?? '—' }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">{{ r.clientCode }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-sm">{{ r.submittedByName ?? '—' }}</td>
              <td class="px-4 py-3 text-sm">{{ fmtDate(r.submittedAt) }}</td>
              <td class="px-4 py-3">
                <span
                  class="rounded px-2 py-0.5 text-sm font-semibold"
                  :class="waiting(r.submittedAt).urgent
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                    : 'text-gray-600 dark:text-gray-300'"
                >
                  {{ waiting(r.submittedAt).text }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <NuxtLink :to="r.href">
                  <UButton color="primary" size="sm">
                    <span class="font-[Moul]">{{ tr('ពិនិត្យ') }}</span>
                  </UButton>
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
