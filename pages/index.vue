<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import gazetteers from "~~/store/data/gazetteers";

/**
 * The ministry overview.
 *
 * Every number here is queried. The page it replaces showed "គណនីសរុប 30" and
 * "អ្នកប្រើប្រាស់ថ្ងៃនេះ 150 +3%" as literals in the template, wired to nothing.
 *
 * What a ministry official is answering, in the order the page answers it:
 *   1. How big is the caseload, and how much of it is waiting on me?
 *   2. Where do cases stall on their way through the six ទម្រង់?
 *   3. Is intake rising or falling?
 *   4. When cases close, do they close well?
 *   5. Who are these clients, and where are they?
 */
const { data: auth } = useAuth();
definePageMeta({ auth: true });

useHead({ title: "ផ្ទាំងគ្រប់គ្រង" });

const { data: s, status, error, refresh } = await useLazyFetch<any>("/api/dashboard/summary");

const loading = computed(() => status.value === "pending");

/** Province codes are stored; the gazetteer holds the Khmer names. */
const provinceName = (code: string) =>
  (gazetteers as any[]).find((p) => p.code === code)?.name?.km ?? code ?? "មិនបានកំណត់";

const provinceRows = computed(() =>
  (s.value?.provinces ?? []).map((p: any) => ({ label: provinceName(p.code), count: p.count }))
);

const closure = computed(() => {
  const c = s.value?.closureOutcomes ?? { successful: 0, unsuccessful: 0 };
  const total = c.successful + c.unsuccessful;
  return { ...c, total, rate: total ? Math.round((c.successful / total) * 100) : null };
});

/** The stat tiles. A single number is a tile, never a one-bar chart. */
const tiles = computed(() => [
  {
    label: "អតិថិជនសរុប", value: s.value?.totals?.clients ?? 0, icon: "users",
    note: `ករណីកំពុងដំណើរការ ${s.value?.totals?.openCases ?? 0}`, to: "/client",
  },
  {
    label: "រង់ចាំការអនុម័ត", value: s.value?.totals?.awaitingApproval ?? 0, icon: "clock",
    note: "លើទម្រង់ទាំង៦", accent: (s.value?.totals?.awaitingApproval ?? 0) > 0,
  },
  {
    label: "ករណីបានបិទ", value: s.value?.totals?.closedCases ?? 0, icon: "check-circle",
    note: closure.value.rate === null ? "មិនទាន់មានទិន្នន័យ" : `ជោគជ័យ ${closure.value.rate}%`,
  },
  {
    label: "មជ្ឈមណ្ឌល", value: s.value?.totals?.centres ?? 0, icon: "home",
    note: `សេវាកម្ម ${s.value?.totals?.services ?? 0}`, to: "/center/list",
  },
]);

const fmtWhen = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const FORM_NAME: Record<string, string> = {
  CLIENT: "ទម្រង់ទី១", CLIENT_SERVICE: "ទម្រង់ទី២", CASE_PLAN: "ទម្រង់ទី៣",
  REINTEGRATION: "ទម្រង់ទី៤", FOLLOW_UP: "ទម្រង់ទី៥", CASE_CLOSURE: "ទម្រង់ទី៦",
};
const STATUS_NAME: Record<string, string> = {
  DRAFT: "ព្រាង", SUBMITTED: "បានស្នើសុំ", APPROVED: "បានអនុម័ត", REJECTED: "បានបដិសេធ",
};
</script>

<template>
  <ChartPalette>
    <div class="font-[Battambang]">
      <div class="mt-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-[Moul] text-primary">ផ្ទាំងគ្រប់គ្រង</h2>
            <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
              ជំរាបសួរ
              <!-- @ts-ignore -->
              {{ (auth as any)?.fullname || (auth as any)?.username || '' }}
            </p>
          </div>
          <UButton color="gray" size="xl" :loading="loading" @click="refresh()">
            <TwFeather type="refresh-cw" :size="18" class="mr-1" />
            <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.refresh') }}</span>
          </UButton>
        </div>
        <hr class="my-2 border dark:border-gray-700" />

        <div v-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
          <p class="text-lg text-red-600 dark:text-red-400">មិនអាចទាញយកទិន្នន័យបានទេ</p>
          <UButton color="primary" class="mt-4" @click="refresh()"><span class="font-[Moul]">ព្យាយាមម្តងទៀត</span></UButton>
        </div>

        <div v-else class="grid grid-cols-12 items-start gap-4">
          <!-- 1. The headline numbers -->
          <component :is="t.to ? 'NuxtLink' : 'div'" v-for="t in tiles" :key="t.label" :to="t.to"
            class="col-span-12 sm:col-span-6 xl:col-span-3">
            <div class="h-full rounded-lg bg-white p-4 shadow transition-shadow dark:bg-gray-800"
              :class="t.to ? 'hover:shadow-md' : ''">
              <div class="flex items-start justify-between gap-3">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ t.label }}</span>
                <TwFeather :type="t.icon" :size="18"
                  :class="t.accent ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600'" />
              </div>
              <!-- Proportional figures on a hero value, not tabular-nums. -->
              <div v-if="loading" class="mt-2 h-9 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
              <p v-else class="mt-1 text-3xl font-semibold text-gray-800 dark:text-gray-100">{{ t.value }}</p>
              <p class="mt-1 text-xs text-gray-400">{{ t.note }}</p>
            </div>
          </component>

          <!-- 2. Where cases stall -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-7">
            <h3 class="text-xl font-[Moul] text-primary">ដំណើរការករណីតាមទម្រង់</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ចំនួនអតិថិជនដែលបានឆ្លងកាត់ដល់ទម្រង់នីមួយៗ
            </p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-64 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartFunnel v-else :stages="s?.funnel ?? []" />
          </section>

          <!-- and what is waiting on a signature -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-5">
            <h3 class="text-xl font-[Moul] text-primary">ស្ថានភាពការអនុម័ត</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">តាមទម្រង់នីមួយៗ</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-64 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartApprovalBars v-else :forms="s?.approval ?? []" />
          </section>

          <!-- 3. Is intake rising? -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-8">
            <h3 class="text-xl font-[Moul] text-primary">ការចុះឈ្មោះអតិថិជន</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">១២ខែចុងក្រោយ តាមកាលបរិច្ឆេទសម្ភាសន៍</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-52 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartAreaTrend v-else :points="s?.intakeByMonth ?? []" />
          </section>

          <!-- 4. Do cases close well? Two values — a compare, not a 2-slice pie. -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">លទ្ធផលនៃការបិទករណី</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">តាមទម្រង់ទី៦</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-52 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else-if="closure.total">
              <p class="text-3xl font-semibold text-gray-800 dark:text-gray-100">
                {{ closure.rate }}<span class="text-lg font-normal text-gray-400">%</span>
              </p>
              <p class="mb-4 text-xs text-gray-400">សមាហរណកម្មជោគជ័យ</p>
              <ChartBarRows :rows="[
                { label: 'សមាហរណកម្មជោគជ័យ', count: closure.successful },
                { label: 'សមាហរណកម្មមិនជោគជ័យ', count: closure.unsuccessful },
              ]" color="var(--status-good)" />
            </template>
            <p v-else class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
              មិនទាន់មានករណីបានបិទនៅឡើយទេ
            </p>
          </section>

          <!-- 5. Who and where -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">អតិថិជនតាមខេត្ត</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartBarRows v-else :rows="provinceRows" color="var(--series-1)" :max="8" />
          </section>

          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">អតិថិជនតាមអាយុ</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else>
              <ChartBarRows :rows="s?.ageBands ?? []" color="var(--series-3)" :max="7" />
              <p v-if="s?.ageUnknown" class="mt-3 text-xs text-gray-400">
                មិនមានថ្ងៃខែឆ្នាំកំណើត {{ s.ageUnknown }}
              </p>
            </template>
          </section>

          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">អតិថិជនតាមភេទ និងមជ្ឈមណ្ឌល</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else>
              <ChartBarRows :rows="s?.gender ?? []" color="var(--series-2)" :max="4" />
              <h4 class="mb-2 mt-5 text-sm text-gray-500 dark:text-gray-400">តាមមជ្ឈមណ្ឌល</h4>
              <ChartBarRows :rows="s?.centres ?? []" color="var(--series-4)" :max="5" />
            </template>
          </section>

          <!-- The audit trail, as a table: it is a list of events, not a shape. -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 class="text-xl font-[Moul] text-primary">សកម្មភាពអនុម័តថ្មីៗ</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <p v-else-if="!s?.recentEvents?.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
              មិនទាន់មានសកម្មភាពនៅឡើយទេ
            </p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="py-2 pr-4 font-normal">ពេលវេលា</th>
                    <th class="py-2 pr-4 font-normal">ទម្រង់</th>
                    <th class="py-2 pr-4 font-normal">ការផ្លាស់ប្តូរ</th>
                    <th class="py-2 pr-4 font-normal">ដោយ</th>
                    <th class="py-2 font-normal">មូលហេតុ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="(e, i) in s.recentEvents" :key="i">
                    <td class="whitespace-nowrap py-2 pr-4 tabular-nums text-gray-500">{{ fmtWhen(e.createdAt) }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-200">{{ FORM_NAME[e.recordType] ?? e.recordType }}</td>
                    <td class="whitespace-nowrap py-2 pr-4 text-gray-700 dark:text-gray-200">
                      {{ STATUS_NAME[e.fromStatus] ?? '—' }} → {{ STATUS_NAME[e.toStatus] ?? e.toStatus }}
                    </td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-200">{{ e.actor }}</td>
                    <td class="py-2 text-gray-500 dark:text-gray-400">{{ e.reason || '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  </ChartPalette>
</template>
