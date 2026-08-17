<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * Where every ទម្រង់ stands in the approval pipeline.
 *
 * Stacked, one row per form, because the question is "how much of this form's
 * work is waiting on someone" — a part-to-whole per row, compared down the
 * column.
 *
 * The four states use the reserved status palette, not categorical slots: they
 * are states, not series. Two of them sit below 3:1 on a white surface by
 * design, so each ships with an icon and a label in the legend and a number in
 * the table below — a status colour never carries the meaning alone.
 *
 * A 2px surface gap separates the segments rather than a border around them.
 */
const props = defineProps<{
  forms: { key: string; label: string; DRAFT: number; SUBMITTED: number; APPROVED: number; REJECTED: number }[];
}>();

const STATES = [
  { key: "APPROVED", label: "បានអនុម័ត", color: "var(--status-good)", icon: "check-circle" },
  { key: "SUBMITTED", label: "រង់ចាំអនុម័ត", color: "var(--status-warning)", icon: "clock" },
  { key: "REJECTED", label: "បានបដិសេធ", color: "var(--status-critical)", icon: "x-circle" },
  { key: "DRAFT", label: "ព្រាង", color: "var(--grid)", icon: "edit-3" },
] as const;

const rows = computed(() =>
  props.forms.map((f) => {
    const total = f.DRAFT + f.SUBMITTED + f.APPROVED + f.REJECTED;
    return {
      ...f,
      total,
      segments: STATES.map((s) => ({
        ...s,
        count: (f as any)[s.key] as number,
        pct: total ? ((f as any)[s.key] / total) * 100 : 0,
      })).filter((s) => s.count > 0),
    };
  })
);

const anyData = computed(() => rows.value.some((r) => r.total > 0));
const showTable = ref(false);
</script>

<template>
  <div>
    <p v-if="!anyData" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
      មិនទាន់មានកំណត់ត្រានៅឡើយទេ
    </p>

    <template v-else>
      <!-- Legend is always present: four states, each with icon + label, so
           identity never rests on colour alone. -->
      <div class="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        <span v-for="s in STATES" :key="s.key" class="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
          <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: s.color }" />
          <TwFeather :type="s.icon" :size="13" class="shrink-0 text-gray-400" />
          {{ s.label }}
        </span>
      </div>

      <div class="space-y-3">
        <div v-for="r in rows" :key="r.key">
          <div class="flex items-baseline justify-between gap-3">
            <span class="min-w-0 flex-1 truncate text-sm text-gray-600 dark:text-gray-300">{{ r.label }}</span>
            <span class="shrink-0 text-sm font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ r.total }}</span>
          </div>
          <div v-if="r.total" class="mt-1 flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
            <div v-for="s in r.segments" :key="s.key" :style="{ width: s.pct + '%', background: s.color }"
              :title="`${r.label} — ${s.label}: ${s.count}`" class="first:rounded-l-full last:rounded-r-full" />
          </div>
          <div v-else class="mt-1 h-2.5 w-full rounded-full" style="background: var(--grid)" />
        </div>
      </div>

      <!-- The table view the relief rule requires, and the answer for anyone who
           cannot separate two of these hues. -->
      <button type="button" class="no-print mt-4 text-xs text-primary hover:underline" @click="showTable = !showTable">
        {{ showTable ? 'បិទតារាង' : 'មើលជាតារាង' }}
      </button>
      <div v-if="showTable" class="mt-2 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <tr>
              <th class="py-2 pr-3 font-normal">ទម្រង់</th>
              <th v-for="s in STATES" :key="s.key" class="py-2 pr-3 text-right font-normal">{{ s.label }}</th>
              <th class="py-2 text-right font-normal">សរុប</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="r in rows" :key="r.key">
              <td class="py-2 pr-3 text-gray-700 dark:text-gray-200">{{ r.label }}</td>
              <td v-for="s in STATES" :key="s.key" class="py-2 pr-3 text-right tabular-nums text-gray-700 dark:text-gray-200">
                {{ (r as any)[s.key] }}
              </td>
              <td class="py-2 text-right font-medium tabular-nums text-gray-800 dark:text-gray-100">{{ r.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
