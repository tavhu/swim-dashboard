<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * ខ. សេវាបញ្ចូនបន្ត — a repeatable list of onward referrals on ទម្រង់ទី៣.
 *
 * Each entry is a full referral, not a service line: the two sections the manual
 * gives it — the reason and service detail, then the consent and paperwork — laid
 * out per block so a plan can carry several referrals, each added and removed on
 * its own.
 *
 * Attachments are per row. A row keeps its chosen-but-not-yet-uploaded files on a
 * transient `_pending`, which the parent form uploads on save and then strips —
 * uploading here would orphan files whenever a plan is abandoned, the same reason
 * AttachmentField defers it everywhere else.
 */
const props = withDefaults(
  defineProps<{
    modelValue: any[];
    /** Referral service types from the Referral & Service Details table. */
    types: any[];
    readOnly?: boolean;
    /** The signer's own name, for the signature check. */
    signerName?: string;
  }>(),
  { readOnly: false, signerName: "" }
);

const emit = defineEmits<{ (e: "update:modelValue", v: any[]): void }>();

const rows = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const blank = () => ({
  referralTypeId: "",
  primaryReason: "",
  currentSituation: "",
  urgency: "ROUTINE",
  startDate: "",
  endDate: "",
  consentObtained: false,
  attachments: "",
  signature: "",
  _pending: [] as File[],
});

const add = () => (rows.value = [...rows.value, blank()]);
const remove = (i: number) => {
  const next = [...rows.value];
  next.splice(i, 1);
  rows.value = next.length ? next : [blank()];
};

const URGENCY = computed(() => [
  { value: "ROUTINE", label: tr("ធម្មតា") },
  { value: "URGENT", label: tr("បន្ទាន់") },
  { value: "EMERGENCY", label: tr("អាសន្ន") },
]);

/** The signature, when filled, must match the signer's own name. */
const normalise = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const mismatched = (row: any) =>
  !!String(row.signature ?? "").trim() &&
  (!props.signerName || normalise(row.signature) !== normalise(props.signerName));
</script>

<template>
  <div class="space-y-4">
    <div
      v-for="(row, i) in rows"
      :key="i"
      class="rounded-lg border p-4 dark:border-gray-700"
    >
      <div class="mb-3 flex items-center justify-between">
        <span class="font-[Moul] text-primary">{{ tr('ការបញ្ជូនទី') }} {{ i + 1 }}</span>
        <UButton color="red" variant="soft" size="sm" type="button" :disabled="readOnly" @click="remove(i)">
          <TwFeather type="trash-2" :size="16" class="mr-1" />
          <span>{{ $t('action.removeRow') }}</span>
        </UButton>
      </div>

      <!-- មូលហេតុនៃការបញ្ជូន និងព័ត៌មានលម្អិតអំពីសេវា -->
      <p class="text-sm font-semibold text-gray-600 dark:text-gray-300">
        {{ tr('មូលហេតុនៃការបញ្ជូន និងព័ត៌មានលម្អិតអំពីសេវា') }}
      </p>
      <div class="mt-2 grid grid-cols-12 gap-3">
        <label class="col-span-12 lg:col-span-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ប្រភេទសេវា/ជំនួយដែលស្នើសុំ') }}</span>
          <select v-model="row.referralTypeId" :disabled="readOnly"
            class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
            <option value="">{{ $t('action.selectOne') }}</option>
            <option v-for="s in types" :key="s.id" :value="s.id">{{ s.nameKh }}</option>
          </select>
        </label>

        <div class="col-span-12 lg:col-span-6">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កម្រិតបន្ទាន់') }}</span>
          <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            <label v-for="u in URGENCY" :key="u.value" class="flex items-center gap-2">
              <input v-model="row.urgency" type="radio" :value="u.value" :disabled="readOnly" />
              <span>{{ u.label }}</span>
            </label>
          </div>
        </div>

        <label class="col-span-12">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('មូលហេតុចម្បងនៃការបញ្ជូន') }}</span>
          <textarea v-model="row.primaryReason" :disabled="readOnly" rows="2"
            class="mt-1 w-full rounded border p-2 text-base dark:border-gray-700 dark:bg-gray-900" />
        </label>

        <label class="col-span-12">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ស្ថានភាពបច្ចុប្បន្ន និងសាវតាពាក់ព័ន្ធ') }}</span>
          <textarea v-model="row.currentSituation" :disabled="readOnly" rows="3"
            class="mt-1 w-full rounded border p-2 text-base dark:border-gray-700 dark:bg-gray-900" />
        </label>

        <label class="col-span-6 lg:col-span-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទចាប់ផ្តើម') }}</span>
          <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="row.startDate"
            :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
        </label>
        <label class="col-span-6 lg:col-span-3">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទបញ្ចប់') }}</span>
          <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="row.endDate"
            :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
        </label>
      </div>

      <!-- ការយល់ព្រម និងឯកសារភ្ជាប់ -->
      <p class="mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
        {{ tr('ការយល់ព្រម និងឯកសារភ្ជាប់') }}
      </p>
      <div class="mt-2 space-y-3">
        <label class="flex items-start gap-3">
          <input v-model="row.consentObtained" type="checkbox" :disabled="readOnly" class="mt-1 h-5 w-5 rounded" />
          <span>
            <span class="text-gray-700 dark:text-gray-200">{{ tr('បានទទួលការយល់ព្រមពីអតិថិជន') }}</span>
            <span class="block text-sm text-gray-500 dark:text-gray-400">
              {{ tr('អតិថិជនបានយល់ព្រមឲ្យបញ្ជូន និងចែករំលែកព័ត៌មានពាក់ព័ន្ធ') }}
            </span>
          </span>
        </label>

        <AttachmentField
          v-model="row.attachments"
          v-model:pending="row._pending"
          :read-only="readOnly"
          :label="tr('ឯកសារភ្ជាប់')"
          :hint="tr('ឯកសារវាយតម្លៃ អត្តសញ្ញាណប័ណ្ណ ឬកំណត់ត្រាសុខភាព')"
        />

        <label class="block">
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ហត្ថលេខា / សេចក្តីប្រកាស') }}</span>
          <input v-model="row.signature" type="text" :disabled="readOnly"
            :placeholder="signerName || tr('ហត្ថលេខា')"
            class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900"
            :class="mismatched(row) ? 'border-red-500' : ''" />
          <span v-if="mismatched(row)" class="mt-1 block text-sm text-red-600">
            {{ tr('ហត្ថលេខាត្រូវតែជាឈ្មោះពេញរបស់អ្នក') }}: {{ signerName }}
          </span>
        </label>
      </div>
    </div>

    <UButton color="gray" size="sm" type="button" :disabled="readOnly" @click="add">
      <TwFeather type="plus" :size="16" class="mr-1" />
      <span>{{ tr('បន្ថែមការបញ្ជូន') }}</span>
    </UButton>
  </div>
</template>
