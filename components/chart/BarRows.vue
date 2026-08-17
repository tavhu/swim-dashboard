<script setup lang="ts">
/**
 * Horizontal bars with the label outside the bar and the value at its end.
 *
 * Horizontal rather than vertical because every label here is Khmer prose —
 * A long Khmer centre name cannot be a readable x-axis
 * tick at any width. Bars, not a donut, wherever values may be close: a donut
 * only reads part-to-whole at a glance.
 *
 * Marks: thin rows, 4px rounded end, no border — a 2px surface gap separates
 * adjacent bars. Values sit outside the bar end, so nothing is ever clipped by a
 * short bar.
 */
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    rows: { label: string; count: number }[];
    /** Which categorical slot. Bars in one chart share a colour: the label
     *  carries identity, so hue is not encoding anything. */
    color?: string;
    /** Cap the list and fold the rest into one "other" row, per the ~7-class limit. */
    max?: number;
    /** Defaults to the shared "no data yet" line when a caller gives none. */
    emptyText?: string;
  }>(),
  { color: "var(--series-1)", max: 8, emptyText: "" }
);

const shown = computed(() => {
  const sorted = [...props.rows].filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  if (sorted.length <= props.max) return sorted;
  const head = sorted.slice(0, props.max - 1);
  const rest = sorted.slice(props.max - 1).reduce((n, r) => n + r.count, 0);
  return [...head, { label: t("chart.other"), count: rest }];
});

const peak = computed(() => Math.max(1, ...shown.value.map((r) => r.count)));
const total = computed(() => shown.value.reduce((n, r) => n + r.count, 0));
const pct = (n: number) => (total.value ? Math.round((n / total.value) * 100) : 0);
</script>

<template>
  <p v-if="!shown.length" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
    {{ emptyText || $t('chart.noData') }}
  </p>

  <div v-else class="space-y-3">
    <div v-for="r in shown" :key="r.label" class="group"
      :title="`${r.label}: ${r.count} (${pct(r.count)}%)`">
      <div class="flex items-baseline justify-between gap-3">
        <span class="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-300">{{ r.label }}</span>
        <!-- tabular-nums here: these align vertically down the column -->
        <span class="shrink-0 text-sm font-medium tabular-nums text-gray-800 dark:text-gray-100">
          {{ r.count }}
          <span class="ml-1 text-xs font-normal text-gray-400">{{ pct(r.count) }}%</span>
        </span>
      </div>
      <!-- The track is one shade off the surface, not a border. -->
      <div class="mt-1 h-2 w-full overflow-hidden rounded-full" style="background: var(--grid)">
        <div class="h-full rounded-full transition-[width] duration-500"
          :style="{ width: Math.max(2, (r.count / peak) * 100) + '%', background: color }" />
      </div>
    </div>
  </div>
</template>
