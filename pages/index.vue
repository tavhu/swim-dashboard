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
 *   2. Where do cases stall on their way through the six forms?
 *   3. Is intake rising or falling?
 *   4. When cases close, do they close well?
 *   5. Who are these clients, and where are they?
 *
 * Bilingual: the endpoint returns keys rather than text, and this page resolves
 * them. The charts stay presentation-only — they receive finished strings and
 * translate only their own furniture. What is deliberately *not* translated is
 * field values: a client's recorded sex and a centre's name are data, and
 * rendering them in a language they were not entered in would misreport them.
 */
const { data: auth } = useAuth();
definePageMeta({ auth: true });

const { t, locale } = useI18n();

useHead(() => ({ title: t("dash.title") }));

const { data: s, status, error, refresh } = await useLazyFetch<any>("/api/dashboard/summary");

const loading = computed(() => status.value === "pending");

/** Province codes are stored; the gazetteer carries both names. */
const provinceName = (code: string) => {
  const p = (gazetteers as any[]).find((x) => x.code === code);
  if (!p) return code ?? t("common.unassigned");
  return (locale.value === "en" ? p.name?.en : p.name?.km) ?? p.name?.km ?? code;
};

const provinceRows = computed(() =>
  (s.value?.provinces ?? []).map((p: any) => ({ label: provinceName(p.code), count: p.count }))
);

/** A row is either a field value or a key standing in for a missing one. */
const nameOf = (r: any) => (r.labelKey ? t(r.labelKey) : r.label);

const genderRows = computed(() =>
  (s.value?.gender ?? []).map((g: any) => ({ label: nameOf(g), count: g.count }))
);
const centreRows = computed(() =>
  (s.value?.centres ?? []).map((c: any) => ({ label: nameOf(c), count: c.count }))
);
const ageRows = computed(() =>
  (s.value?.ageBands ?? []).map((b: any) => ({ label: t(`ageBand.${b.key}`), count: b.count }))
);
const funnelStages = computed(() =>
  (s.value?.funnel ?? []).map((f: any) => ({
    label: t(`stage.${f.key}`),
    form: t(`form.short.${f.form}`),
    count: f.count,
  }))
);
const approvalForms = computed(() =>
  (s.value?.approval ?? []).map((f: any) => ({ ...f, label: t(`form.${f.formKey}`) }))
);

/** Month names follow the language, not the server's fixed en-GB. */
const intakePoints = computed(() =>
  (s.value?.intakeByMonth ?? []).map((m: any) => ({
    key: m.key,
    count: m.count,
    label: new Date(m.year, m.month, 1).toLocaleDateString(
      locale.value === "en" ? "en-GB" : "km-KH",
      { month: "short" }
    ),
  }))
);

const closure = computed(() => {
  const c = s.value?.closureOutcomes ?? { successful: 0, unsuccessful: 0 };
  const total = c.successful + c.unsuccessful;
  return { ...c, total, rate: total ? Math.round((c.successful / total) * 100) : null };
});

/** The stat tiles. A single number is a tile, never a one-bar chart. */
const tiles = computed(() => [
  {
    label: t("dash.totalClients"), value: s.value?.totals?.clients ?? 0, icon: "users",
    note: t("dash.openCases", { count: s.value?.totals?.openCases ?? 0 }), to: "/client",
  },
  {
    label: t("dash.awaitingApproval"), value: s.value?.totals?.awaitingApproval ?? 0, icon: "clock",
    note: t("dash.acrossSixForms"), accent: (s.value?.totals?.awaitingApproval ?? 0) > 0,
  },
  {
    label: t("dash.closedCases"), value: s.value?.totals?.closedCases ?? 0, icon: "check-circle",
    note: closure.value.rate === null
      ? t("dash.noDataYet")
      : t("dash.successRate", { rate: closure.value.rate }),
  },
  {
    label: t("dash.centres"), value: s.value?.totals?.centres ?? 0, icon: "home",
    note: t("dash.servicesCount", { count: s.value?.totals?.services ?? 0 }), to: "/center/list",
  },
]);

const fmtWhen = (d: string) =>
  new Date(d).toLocaleDateString(locale.value === "en" ? "en-GB" : "km-KH", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

/** ApprovalRecordType → the form's translation key. */
const FORM_KEY: Record<string, string> = {
  CLIENT: "f1", CLIENT_SERVICE: "f2", CASE_PLAN: "f3",
  REINTEGRATION: "f4", FOLLOW_UP: "f5", CASE_CLOSURE: "f6",
};
const formName = (recordType: string) =>
  FORM_KEY[recordType] ? t(`form.short.${FORM_KEY[recordType]}`) : recordType;

const STATUS_KEY: Record<string, string> = {
  DRAFT: "draft", SUBMITTED: "submitted", APPROVED: "approved", REJECTED: "rejected",
};
const statusName = (v: string) => (STATUS_KEY[v] ? t(`status.${STATUS_KEY[v]}`) : v);
</script>

<template>
  <ChartPalette>
    <div class="font-[Battambang]">
      <div class="mt-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-[Moul] text-primary">{{ $t('dash.title') }}</h2>
            <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
              {{ $t('dash.greeting') }}
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
          <p class="text-lg text-red-600 dark:text-red-400">{{ $t('dash.loadFailed') }}</p>
          <UButton color="primary" class="mt-4" @click="refresh()">
            <span class="font-[Moul]">{{ $t('action.retry') }}</span>
          </UButton>
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
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.funnelTitle') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('dash.funnelSubtitle') }}</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-64 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartFunnel v-else :stages="funnelStages" />
          </section>

          <!-- and what is waiting on a signature -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-5">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.approvalTitle') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('dash.approvalSubtitle') }}</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-64 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartApprovalBars v-else :forms="approvalForms" />
          </section>

          <!-- 3. Is intake rising? -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-8">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.intakeTitle') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('dash.intakeSubtitle') }}</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-52 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartAreaTrend v-else :points="intakePoints" />
          </section>

          <!-- 4. Do cases close well? Two values — a compare, not a 2-slice pie. -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.closureTitle') }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('dash.closureSubtitle') }}</p>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-52 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else-if="closure.total">
              <p class="text-3xl font-semibold text-gray-800 dark:text-gray-100">
                {{ closure.rate }}<span class="text-lg font-normal text-gray-400">%</span>
              </p>
              <p class="mb-4 text-xs text-gray-400">{{ $t('dash.reintegrationSuccess') }}</p>
              <ChartBarRows :rows="[
                { label: $t('dash.reintegrationSuccess'), count: closure.successful },
                { label: $t('dash.reintegrationFailure'), count: closure.unsuccessful },
              ]" color="var(--status-good)" />
            </template>
            <p v-else class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
              {{ $t('dash.noClosedCases') }}
            </p>
          </section>

          <!-- 5. Who and where -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.byProvince') }}</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <ChartBarRows v-else :rows="provinceRows" color="var(--series-1)" :max="8" />
          </section>

          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.byAge') }}</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else>
              <ChartBarRows :rows="ageRows" color="var(--series-3)" :max="7" />
              <p v-if="s?.ageUnknown" class="mt-3 text-xs text-gray-400">
                {{ $t('dash.noDob', { count: s.ageUnknown }) }}
              </p>
            </template>
          </section>

          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-4">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.byGenderCentre') }}</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-48 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <template v-else>
              <ChartBarRows :rows="genderRows" color="var(--series-2)" :max="4" />
              <h4 class="mb-2 mt-5 text-sm text-gray-500 dark:text-gray-400">{{ $t('dash.byCentre') }}</h4>
              <ChartBarRows :rows="centreRows" color="var(--series-4)" :max="5" />
            </template>
          </section>

          <!-- The audit trail, as a table: it is a list of events, not a shape. -->
          <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
            <h3 class="text-xl font-[Moul] text-primary">{{ $t('dash.recentTitle') }}</h3>
            <hr class="my-2 border dark:border-gray-700" />
            <div v-if="loading" class="h-32 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
            <p v-else-if="!s?.recentEvents?.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
              {{ $t('dash.noActivity') }}
            </p>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="py-2 pr-4 font-normal">{{ $t('dash.when') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ $t('dash.whatForm') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ $t('dash.change') }}</th>
                    <th class="py-2 pr-4 font-normal">{{ $t('dash.by') }}</th>
                    <th class="py-2 font-normal">{{ $t('dash.reason') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="(e, i) in s.recentEvents" :key="i">
                    <td class="whitespace-nowrap py-2 pr-4 tabular-nums text-gray-500">{{ fmtWhen(e.createdAt) }}</td>
                    <td class="py-2 pr-4 text-gray-700 dark:text-gray-200">{{ formName(e.recordType) }}</td>
                    <td class="whitespace-nowrap py-2 pr-4 text-gray-700 dark:text-gray-200">
                      {{ e.fromStatus ? statusName(e.fromStatus) : '—' }} → {{ statusName(e.toStatus) }}
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
