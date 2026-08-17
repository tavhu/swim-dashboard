<script setup lang="ts">
/**
 * Intake over the last twelve months.
 *
 * A line with a soft fill under it: change-over-time, one series, so no legend —
 * the card title names it. 2px stroke, recessive hairline grid, markers only
 * where they mean something (the hovered point and the peak).
 *
 * SVG rather than canvas so it themes from CSS variables, prints crisply through
 * the app's @media print stylesheet, and needs no redraw when the theme flips.
 */
const props = defineProps<{
  points: { label: string; count: number; key: string }[];
}>();

const W = 720;
const H = 200;
const PAD = { top: 16, right: 16, bottom: 28, left: 32 };

const peak = computed(() => Math.max(1, ...props.points.map((p) => p.count)));
const hasData = computed(() => props.points.some((p) => p.count > 0));

const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

const xOf = (i: number) =>
  PAD.left + (props.points.length <= 1 ? plotW / 2 : (i / (props.points.length - 1)) * plotW);
const yOf = (v: number) => PAD.top + plotH - (v / peak.value) * plotH;

const linePath = computed(() =>
  props.points.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(p.count).toFixed(1)}`).join(" ")
);

const areaPath = computed(() => {
  if (!props.points.length) return "";
  const base = PAD.top + plotH;
  return `${linePath.value} L${xOf(props.points.length - 1).toFixed(1)},${base} L${xOf(0).toFixed(1)},${base} Z`;
});

/** Four ticks is enough for a count axis; more is chrome. */
const yTicks = computed(() => {
  const step = Math.max(1, Math.ceil(peak.value / 3));
  const out: number[] = [];
  for (let v = 0; v <= peak.value; v += step) out.push(v);
  return out;
});

const peakIndex = computed(() => props.points.findIndex((p) => p.count === peak.value));

const hover = ref<number | null>(null);
const onMove = (e: MouseEvent) => {
  const svg = e.currentTarget as SVGSVGElement;
  const box = svg.getBoundingClientRect();
  // The hit target is the whole plot width, wider than any marker.
  const x = ((e.clientX - box.left) / box.width) * W;
  const i = Math.round(((x - PAD.left) / plotW) * (props.points.length - 1));
  hover.value = Math.min(props.points.length - 1, Math.max(0, i));
};
</script>

<template>
  <div>
    <p v-if="!hasData" class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
      {{ $t('chart.noIntake12m') }}
    </p>

    <svg v-else :viewBox="`0 0 ${W} ${H}`" class="w-full" role="img"
      :aria-label="$t('chart.intakeAria')" @mousemove="onMove" @mouseleave="hover = null">
      <!-- Solid hairline grid, one shade off the surface. Never dashed. -->
      <g>
        <line v-for="t in yTicks" :key="`g${t}`" :x1="PAD.left" :x2="W - PAD.right" :y1="yOf(t)" :y2="yOf(t)"
          stroke="var(--grid)" stroke-width="1" />
        <text v-for="t in yTicks" :key="`l${t}`" :x="PAD.left - 6" :y="yOf(t) + 4" text-anchor="end"
          class="text-[10px] tabular-nums" fill="var(--axis-ink)">{{ t }}</text>
      </g>

      <path :d="areaPath" fill="var(--series-1)" opacity="0.12" />
      <path :d="linePath" fill="none" stroke="var(--series-1)" stroke-width="2" stroke-linejoin="round"
        stroke-linecap="round" />

      <!-- The peak is worth a permanent marker; the rest arrive on hover. -->
      <circle v-if="peakIndex >= 0" :cx="xOf(peakIndex)" :cy="yOf(points[peakIndex].count)" r="4"
        fill="var(--series-1)" stroke="var(--surface)" stroke-width="2" />

      <g v-if="hover !== null">
        <line :x1="xOf(hover)" :x2="xOf(hover)" :y1="PAD.top" :y2="PAD.top + plotH" stroke="var(--axis-ink)"
          stroke-width="1" opacity="0.4" />
        <circle :cx="xOf(hover)" :cy="yOf(points[hover].count)" r="5" fill="var(--series-1)" stroke="var(--surface)"
          stroke-width="2" />
        <text :x="Math.min(W - PAD.right - 40, Math.max(PAD.left, xOf(hover) - 18))" :y="PAD.top - 4"
          class="text-[11px] font-medium tabular-nums" fill="var(--label-ink)">
          {{ points[hover].label }} · {{ points[hover].count }}
        </text>
      </g>

      <text v-for="(p, i) in points" :key="p.key" :x="xOf(i)" :y="H - 8" text-anchor="middle" class="text-[10px]"
        fill="var(--axis-ink)">{{ p.label }}</text>
    </svg>
  </div>
</template>
