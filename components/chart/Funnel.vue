<script setup lang="ts">
/**
 * How far cases get through the six forms.
 *
 * The one view this system can give that a generic dashboard cannot: each stage
 * counts *clients* who reached it, so a drop between two stages is cases
 * stalling there. The retention figure beside each stage is against the stage
 * above it, which is the number a case manager would act on.
 *
 * One colour, not a ramp: the bar length carries the magnitude, and a six-step
 * ordinal ramp cannot clear the adjacent-lightness gate on a white surface, so a
 * ramp here would be decoration that also failed validation.
 */
const props = defineProps<{
  stages: { label: string; form: string; count: number }[];
}>();

const first = computed(() => props.stages[0]?.count ?? 0);

const rows = computed(() =>
  props.stages.map((s, i) => {
    const prev = i === 0 ? s.count : props.stages[i - 1].count;
    return {
      ...s,
      /** Width against the first stage, so the funnel narrows truthfully. */
      width: first.value ? Math.max(1.5, (s.count / first.value) * 100) : 0,
      /** Kept only where it means something — not on the first stage. */
      retention: i === 0 || !prev ? null : Math.round((s.count / prev) * 100),
      dropped: i === 0 ? 0 : prev - s.count,
    };
  })
);
</script>

<template>
  <p v-if="!first" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
    {{ $t('chart.noClientsYet') }}
  </p>

  <div v-else class="space-y-2">
    <div v-for="(r, i) in rows" :key="r.label" class="rounded-lg p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40"
      :title="`${r.form} — ${r.label}: ${r.count} ${$t('chart.clients')}`">
      <div class="flex items-baseline justify-between gap-3">
        <span class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
          <span class="text-gray-400">{{ i + 1 }}.</span> {{ r.label }}
          <span class="ml-1 text-xs text-gray-400">{{ r.form }}</span>
        </span>
        <span class="shrink-0 text-sm font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ r.count }}</span>
      </div>
      <div class="mt-1 flex items-center gap-2">
        <div class="h-2.5 w-full overflow-hidden rounded-full" style="background: var(--grid)">
          <div class="h-full rounded-full transition-[width] duration-500"
            :style="{ width: r.width + '%', background: 'var(--series-1)' }" />
        </div>
        <!-- Direct-labelled selectively: the retention step, not every number. -->
        <span v-if="r.retention !== null" class="w-14 shrink-0 text-right text-xs tabular-nums"
          :class="r.retention >= 60 ? 'text-gray-500 dark:text-gray-400' : 'text-amber-600 dark:text-amber-400'">
          {{ r.retention }}%
        </span>
        <span v-else class="w-14 shrink-0" />
      </div>
    </div>
  </div>
</template>
