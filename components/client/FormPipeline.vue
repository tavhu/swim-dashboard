<script setup lang="ts">
import { KHMER_DIGIT, type Pipeline, type FormState } from "~~/shared/formPipeline";

/**
 * A client's progress through ទម្រង់ទី១-៦, as one compact block in the list.
 *
 * The list used to carry a single ស្ថានភាពឯកសារ badge, which was ទម្រង់ទី១'s
 * approval status and nothing else — so an officer could not tell from the list
 * which form a client had reached, what was waiting on a director, or what they
 * should open next. All three now read at a glance:
 *
 *   the chips     one per form, coloured by state, so the shape of the row is
 *                 the shape of the case file
 *   the bar       six segments in the same colours — the sweep you see first
 *                 when scanning a page of clients
 *   the label     what to actually do, in words, because a colour is a hint and
 *                 an officer with forty rows wants an instruction
 *
 * On colour alone: the four "started" states are told apart by colour, which is
 * not enough by itself, so each chip carries its state in words in the hover
 * title, and the ជំហានបន្ទាប់ label names the one that needs doing. The two
 * not-started states differ by border as well as colour — dashed for a step that
 * is not open yet, solid for one that is — because that is the distinction an
 * officer acts on most often.
 */
const props = defineProps<{
  pipeline: Pipeline;
  /** Links out to each form; omitted in compact contexts. */
  clientId?: string;
}>();

/**
 * Amber for waiting, green for approved, red for turned back, and an outline for
 * a step that cannot be started yet — locked reads as absent rather than as a
 * problem, which is what it is.
 */
const STATE: Record<FormState, { cls: string; label: string }> = {
  locked: {
    cls: "border border-dashed border-gray-300 text-gray-300 dark:border-gray-600 dark:text-gray-600",
    label: tr("មិនទាន់ដល់វេន"),
  },
  available: {
    cls: "border-2 border-blue-500 text-blue-600 dark:text-blue-400 font-bold",
    label: tr("អាចចាប់ផ្ដើមបាន"),
  },
  draft: {
    cls: "border border-gray-400 bg-gray-100 text-gray-600 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300",
    label: tr("ព្រាង"),
  },
  submitted: {
    cls: "bg-amber-500 text-white",
    label: tr("រង់ចាំអនុម័ត"),
  },
  rejected: {
    cls: "bg-red-600 text-white",
    label: tr("បដិសេធ"),
  },
  approved: {
    cls: "bg-primary text-white",
    label: tr("អនុម័ត"),
  },
};

/** Segment colour for the bar — the same state vocabulary as the chips. */
const BAR: Record<FormState, string> = {
  locked: "bg-gray-200 dark:bg-gray-700",
  available: "bg-blue-200 dark:bg-blue-900",
  draft: "bg-gray-400 dark:bg-gray-500",
  submitted: "bg-amber-500",
  rejected: "bg-red-600",
  approved: "bg-primary",
};

/**
 * What to do next, in words.
 *
 * Four cases, and they are genuinely different instructions: there is something
 * to fix, something to start or finish, nothing to do because a director has it,
 * or the case file is complete.
 */
const nextLabel = computed(() => {
  const p = props.pipeline;
  const step = p.nextForm ? p.steps[p.nextForm - 1] : null;

  if (step?.state === "rejected") {
    return { text: `${tr("កែទម្រង់ទី")}${KHMER_DIGIT[step.form]}`, cls: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" };
  }
  if (step) {
    const verb = step.state === "draft" ? tr("បន្តទម្រង់ទី") : tr("ចាប់ផ្ដើមទម្រង់ទី");
    return { text: `${verb}${KHMER_DIGIT[step.form]}`, cls: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" };
  }
  if (p.awaiting > 0) {
    return { text: tr("រង់ចាំការអនុម័ត"), cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" };
  }
  return { text: tr("បញ្ចប់គ្រប់ទម្រង់"), cls: "bg-primary/10 text-primary" };
});

/** "ទម្រង់ទី៣ · រង់ចាំអនុម័ត · ២ កំណត់ត្រា" — the whole state of a step in a hover. */
const stepTitle = (s: { form: number; state: FormState; count: number }) =>
  `${tr("ទម្រង់ទី")}${KHMER_DIGIT[s.form]} · ${STATE[s.state].label}` +
  (s.count > 1 ? ` · ${s.count} ${tr("កំណត់ត្រា")}` : "");
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <!-- The six steps. The number says which ទម្រង់; the fill says how it is
         doing; the title says both in words. -->
    <div class="flex items-center gap-1">
      <span
        v-for="s in pipeline.steps"
        :key="s.form"
        :title="stepTitle(s)"
        class="relative grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] leading-none"
        :class="STATE[s.state].cls"
      >
        {{ KHMER_DIGIT[s.form] }}
        <!-- More than one episode behind this step. -->
        <span
          v-if="s.count > 1"
          class="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center rounded-full bg-gray-800 text-[8px] font-bold text-white dark:bg-gray-200 dark:text-gray-900"
        >{{ s.count }}</span>
      </span>
    </div>

    <!-- The bar: the same six states as one sweep, plus the count that answers
         "is this finished?" without counting chips. -->
    <div class="flex items-center gap-2">
      <div class="flex h-1.5 w-[132px] gap-0.5 overflow-hidden rounded-full">
        <span v-for="s in pipeline.steps" :key="`bar-${s.form}`" class="flex-1 rounded-sm" :class="BAR[s.state]" />
      </div>
      <span class="text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
        {{ pipeline.approved }}/6
      </span>
    </div>

    <span class="w-fit rounded px-1.5 py-0.5 text-[11px] font-semibold" :class="nextLabel.cls">
      {{ nextLabel.text }}
    </span>
  </div>
</template>
