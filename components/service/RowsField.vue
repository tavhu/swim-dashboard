<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * A numbered, repeatable list of services with the dates they run between —
 * ក. សកម្មភាពសេវាកម្ម on ទម្រង់ទី៣, and both
 * ២. សេវាកម្មដែលបានទទួលកន្លងមក and ៤. សេវាកម្មនៅសហគមន៍ត្រូវផ្តល់បន្ត on ទម្រង់ទី៤.
 *
 * One component rather than three near-identical blocks of markup. The only
 * thing that differs is whether a row carries a លទ្ធផល, which the manual asks
 * for on services already delivered and not on ones yet to start — so
 * `outcomes` is a list of choices when the column is wanted and omitted when it
 * is not.
 *
 * Rows are positional: the manual numbers them ១, ២, ៣, and the ល.រ shown here
 * is the sortOrder the server stores.
 */
const props = withDefaults(
  defineProps<{
    modelValue: any[];
    services: any[];
    /** Pass the choice list to show a លទ្ធផល column; omit for no outcome. */
    outcomes?: readonly string[] | null;
    readOnly?: boolean;
    addLabel?: string;
  }>(),
  { outcomes: null, readOnly: false, addLabel: "បន្ថែមសកម្មភាព" }
);

const emit = defineEmits<{ (e: "update:modelValue", v: any[]): void }>();

const { localisedName } = useLocalisedName();

const blank = () => ({ serviceId: "", startDate: "", endDate: "", outcome: "" });

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const add = () => (rows.value = [...rows.value, blank()]);

const remove = (i: number) => {
  const next = [...rows.value];
  next.splice(i, 1);
  // Never leave the table with no rows: the add button would be the only way
  // back, and an empty table reads as though the section is unavailable.
  rows.value = next.length ? next : [blank()];
};
</script>

<template>
  <div>
    <div class="space-y-3">
      <div v-for="(row, i) in rows" :key="i"
        class="grid grid-cols-1 items-end gap-3 rounded-lg border p-3 dark:border-gray-700 sm:grid-cols-12">
        <div class="sm:col-span-1">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ល.រ') }}</span>
          <p class="mt-1 h-10 text-base leading-10 text-gray-800 dark:text-gray-100">{{ i + 1 }}</p>
        </div>

        <label class="block" :class="outcomes ? 'sm:col-span-3' : 'sm:col-span-5'">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('សេវាកម្ម') }}</span>
          <select v-model="row.serviceId" :disabled="readOnly"
            class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
            <option value="">{{ $t('action.selectOne') }}</option>
            <option v-for="s in services" :key="s.id" :value="s.id">{{ localisedName(s) }}</option>
          </select>
        </label>

        <label class="block sm:col-span-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទចាប់ផ្តើម') }}</span>
          <Datepicker v-model="row.startDate" :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy"
            class="mt-1" />
        </label>

        <label class="block sm:col-span-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទបញ្ចប់') }}</span>
          <Datepicker v-model="row.endDate" :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy"
            class="mt-1" />
        </label>

        <label v-if="outcomes" class="block sm:col-span-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លទ្ធផល') }}</span>
          <select v-model="row.outcome" :disabled="readOnly"
            class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
            <option value="">{{ $t('action.selectOne') }}</option>
            <option v-for="o in outcomes" :key="o" :value="o">{{ o }}</option>
          </select>
        </label>

        <div class="sm:col-span-2">
          <UButton color="red" variant="soft" size="sm" type="button" :disabled="readOnly" @click="remove(i)">
            <TwFeather type="trash-2" :size="16" class="mr-1" />
            <span>{{ $t('action.removeRow') }}</span>
          </UButton>
        </div>
      </div>
    </div>

    <UButton color="gray" size="sm" type="button" class="mt-3" :disabled="readOnly" @click="add">
      <TwFeather type="plus" :size="16" class="mr-1" />
      <span>{{ addLabel }}</span>
    </UButton>
  </div>
</template>
