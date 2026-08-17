<script setup lang="ts">
import { TwForm, TwInput, TwTextarea, TwToggle, useForm, useToast } from "vue3-tailwind";

/**
 * ប្រភេទអតិថិជន create/edit form.
 *
 * One component for both, as the approval panel is for all six ទម្រង់ — the
 * only difference between adding a category and editing one is whether an id
 * goes up with the payload, which is not worth a second copy of the fields.
 *
 * The category list is what feeds the ប្រភេទអតិថិជន dropdown on ទម្រង់ទី២, so a
 * name saved here is a name a social worker will have to pick from later.
 */
const props = defineProps<{
  /** Omitted when adding. */
  id?: string;
  readOnly?: boolean;
}>();

const router = useRouter();
const { t } = useI18n();
const toast = useToast();

const formName = "clientTypeForm";
const composableForm = useForm();
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value?.validator);

const isError = ref(false);
const busy = ref(false);
const loading = ref(!!props.id);
const loadError = ref<string | null>(null);

const formData = reactive({
  code: "",
  nameKh: "",
  nameEn: "",
  description: "",
  isActive: true,
});

/**
 * `code` is deliberately not required. Left blank the database issues CT001,
 * CT002 … from a sequence; typed in, the ministry's own code is kept. Both are
 * unique, and the handler turns a collision into a 409 naming the field rather
 * than a 500.
 */
const formRules = {
  code: ["string"],
  nameKh: ["string", "required"],
  nameEn: ["string"],
  description: ["string"],
};

const fieldNames = {
  code: "លេខកូដ",
  nameKh: "ឈ្មោះ (ខ្មែរ)",
  nameEn: "ឈ្មោះ (អង់គ្លេស)",
  description: "បរិយាយ",
};

onMounted(async () => {
  if (!props.id) return;
  try {
    // $fetch, not useFetch — useFetch is a setup-only composable and silently
    // never fires from inside onMounted, which is what left the ទម្រង់ទី១ edit
    // form blank.
    const res: any = await $fetch(`/api/client-type/${props.id}`);
    const row = res?.data;
    if (!row?.id) throw new Error("រកមិនឃើញប្រភេទអតិថិជននេះទេ");
    formData.code = row.code ?? "";
    formData.nameKh = row.nameKh ?? "";
    formData.nameEn = row.nameEn ?? "";
    formData.description = row.description ?? "";
    formData.isActive = row.isActive ?? true;
  } catch (e: any) {
    loadError.value = e?.statusMessage ?? e?.data?.statusMessage ?? e?.message ?? t('message.loadFailed');
  } finally {
    loading.value = false;
  }
});

async function submit() {
  if (props.readOnly || busy.value) return;
  if (!(await confirmDialog())) return;

  if (validator.value) {
    validator.value.clearErrors();
    await validator.value.validate();
    if (validator.value.fail()) {
      toast.error({ message: validator.value.getErrorMessage() });
      isError.value = true;
      setTimeout(() => (isError.value = false), 1000);
      return;
    }
  }

  busy.value = true;
  try {
    await $fetch("/api/client-type/upsert", {
      method: "POST",
      body: { id: props.id, ...formData },
    });
    toast.success({ message: t('message.saved') });
    router.push("/client-type");
  } catch (e: any) {
    // The handler answers a duplicate code with a 409 and a Khmer message
    // saying which field to change; showing it beats a generic failure.
    toast.error({
      message:
        e?.data?.statusMessage ??
        e?.statusMessage ??
        e?.data?.message ??
        "មិនអាចរក្សាទុកបានទេ",
    });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

    <div v-else-if="loadError" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
      <p class="text-lg text-red-600 dark:text-red-400">{{ loadError }}</p>
      <NuxtLink to="/client-type">
        <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
      </NuxtLink>
    </div>

    <TwForm v-else :name="formName" :rules="formRules" :custom-field-name="fieldNames" :class="{ 'tw-shake': isError }"
      class="grid grid-cols-12 gap-4 rounded-lg bg-white p-4 shadow dark:border dark:border-gray-700 dark:bg-gray-900"
      @submit="submit">
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="លេខកូដ" name="code" v-model="formData.code"
          :placeholder="props.id ? 'លេខកូដ' : 'ទុកទទេ ដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ'" :disabled="readOnly" />
        <p v-if="!props.id" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          បើទុកទទេ ប្រព័ន្ធនឹងបង្កើតលេខកូដឱ្យ (ឧ. CT001)
        </p>
        <CustomErrorMessage name="code" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ឈ្មោះ (ខ្មែរ)" name="nameKh" v-model="formData.nameKh" placeholder="ឈ្មោះប្រភេទអតិថិជន" required
          :disabled="readOnly" />
        <CustomErrorMessage name="nameKh" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ឈ្មោះ (អង់គ្លេស)" name="nameEn" v-model="formData.nameEn" placeholder="ឈ្មោះជាភាសាអង់គ្លេស"
          :disabled="readOnly" />
        <CustomErrorMessage name="nameEn" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <!-- activeText/inactiveText default to "Active"/"Inactive"; the rest of
             the form is Khmer, so they are set rather than left in English. -->
        <TwToggle label="ដំណើរការ" name="isActive" id="clientTypeActive" v-model="formData.isActive"
          active-text="ដំណើរការ" inactive-text="បិទដំណើរការ" :disabled="readOnly" />
        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          បើបិទ ប្រភេទនេះនឹងមិនបង្ហាញក្នុងទម្រង់ទី២ទេ ប៉ុន្តែកំណត់ត្រាចាស់នៅតែរក្សាទុកដដែល
        </p>
      </div>

      <div class="col-span-12">
        <TwTextarea label="បរិយាយ" name="description" v-model="formData.description" placeholder="បរិយាយអំពីប្រភេទនេះ"
          :disabled="readOnly" />
        <CustomErrorMessage name="description" />
      </div>

      <div class="col-span-12 mt-4 flex justify-end gap-2">
        <NuxtLink to="/client-type">
          <UButton color="gray" size="xl" type="button">
            <span class="font-[Moul] text-lg">{{ $t('action.back') }}</span>
          </UButton>
        </NuxtLink>
        <UButton v-if="!readOnly" color="primary" size="xl" type="submit" :loading="busy">
          <span class="font-[Moul] text-lg">{{ $t('action.save') }}</span>
        </UButton>
      </div>
    </TwForm>
  </div>
</template>
