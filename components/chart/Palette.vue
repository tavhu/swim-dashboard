<script setup lang="ts">
/**
 * The chart colour roles, as CSS custom properties.
 *
 * Mounted once by the dashboard and inherited by every chart inside it, so the
 * charts are written against roles (`--series-1`) rather than raw hex, and the
 * light/dark values swap in one place.
 *
 * The palette is the validated default from the dataviz reference, re-checked
 * against this app's own surfaces rather than the reference ones — white cards
 * on light, gray-800 on dark:
 *
 *   light #ffffff  4 categorical slots: all checks pass; aqua (2.82:1) and
 *                  yellow (2.17:1) fall below 3:1, so both carry visible direct
 *                  labels and appear in a table view — the relief rule.
 *   dark  #1f2937  4 slots: all checks pass, all ≥ 3:1.
 *
 * The funnel deliberately uses one colour, not a ramp: a six-step ordinal ramp
 * cannot clear the adjacent-lightness gate on a white surface, and in a funnel
 * the bar length carries the magnitude — hue would be decoration.
 */
</script>

<template>
  <div class="viz-root contents">
    <slot />
  </div>
</template>

<style>
.viz-root {
  /* categorical — assigned in fixed order, never cycled */
  --series-1: #2a78d6;
  --series-2: #eb6834;
  --series-3: #1baf7a;
  --series-4: #eda100;

  /* status — reserved, never reused as a series */
  --status-good: #0ca30c;
  --status-warning: #fab219;
  --status-serious: #ec835a;
  --status-critical: #d03b3b;

  /* chrome */
  --grid: #e5e7eb;
  --axis-ink: #6b7280;
  --label-ink: #374151;
  --surface: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:where(:not([data-theme="light"])) .viz-root {
    --series-1: #3987e5;
    --series-2: #d95926;
    --series-3: #199e70;
    --series-4: #c98500;
    --grid: #374151;
    --axis-ink: #9ca3af;
    --label-ink: #d1d5db;
    --surface: #1f2937;
  }
}

:root[data-theme="dark"] .viz-root {
  --series-1: #3987e5;
  --series-2: #d95926;
  --series-3: #199e70;
  --series-4: #c98500;
  --grid: #374151;
  --axis-ink: #9ca3af;
  --label-ink: #d1d5db;
  --surface: #1f2937;
}
</style>
