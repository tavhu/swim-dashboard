<script setup lang="ts">
import {
  TwForm,
  TwButton,
  TwFile,
  TwInput,
  useToast,
  useForm,
  TwFeather,
  TwSelect,
  TwToggle,
  type DropdownItem,
  TwTextarea,
} from "vue3-tailwind";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  item: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["update:open"]);

const toast = useToast();
const { t } = useI18n();
const composableForm = useForm();
const formName = "organisation";
const formData = reactive({
  id: "",
  name: "",
  logo: "",
  website: "",
  email: "",
  phoneNumber: "",
  address: "",
});

const files = ref();

watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.id = newItem.id;
    formData.name = newItem.name;
    formData.logo = newItem.logo;
    formData.website = newItem.website;
    formData.email = newItem.email;
    formData.phoneNumber = newItem.phoneNumber;
    formData.address = newItem.address;
  } else {
    formData.id = "";
    formData.name = "";
    formData.logo = "";
    formData.website = "";
    formData.email = "";
    formData.phoneNumber = "";
    formData.address = "";
    files.value = null;
  }
});

// One entry per non-nullable column on Organisation, so the form refuses to
// submit what the database would reject. This was `{}`, which meant
// validator.validate() passed everything and the `required` attributes on
// the inputs were decorative.
const formRules = {
  name: ['required'],
}

const isError = ref(false);
const saving = ref(false);
const { uploadFiles } = useFileUpload();

/** The validator's own message is just "1 error occured", which names nothing. */
const FIELD_LABELS: Record<string, string> = {
  name: "ឈ្មោះស្ថាប័ន",
};
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

const submit = async () => {
  if (saving.value) return;
  try {
    // validate() was commented out while fail() was still being read, so the
    // check ran against a validator that had never been given anything to
    // validate — it reported "1 error occured" however complete the form was,
    // and the organisation form could not be submitted at all. Clear, validate,
    // then ask.
    if (validator.value) {
      validator.value.clearErrors();
      await validator.value.validate();
      if (validator.value.fail()) {
        const failed: string[] = validator.value.getFailedFields?.() ?? [];
        toast.error({
          message: failed.length
            ? "សូមបំពេញ៖ " + failed.map((f) => FIELD_LABELS[f] ?? f).join(" / ")
            : validator.value.getErrorMessage(),
        });
        return;
      }
    }

    saving.value = true;

    let logo = formData.logo;
    if (files.value?.length) {
      // Upload first, and let a failure stop the save: storing the record with
      // the previous logo while reporting success is how the client form used
      // to lose photographs.
      const uploaded = await uploadFiles(files.value);
      if (uploaded) logo = (Object.values(uploaded) as string[])[0];
    }

    // $fetch, not useFetch. useFetch is a setup-only composable: called from an
    // event handler it silently never fires, so even once validation passed no
    // request would have left the browser. Same fault as the ទម្រង់ទី១ edit page.
    await $fetch("/api/organisation/upsert", {
      method: "POST",
      body: { ...formData, logo },
    });

    toast.success({ message: t('message.saved') });
    emit("update:open", false);
    // Reset, or the next "add new" opens on the record just saved and the user
    // edits it into a duplicate. The watcher on props.item only clears when the
    // parent passes null, which it does not do after a create.
    resetForm();
  } catch (e: any) {
    // Name what failed rather than reporting only that it did.
    toast.error({
      message: e?.data?.statusMessage ?? e?.data?.error ?? e?.message ?? t('message.notSaved'),
    });
  } finally {
    saving.value = false;
  }
};

/** Back to an empty form — used after a save and when closing. */
const resetForm = () => {
  formData.id = "";
  formData.name = "";
  formData.logo = "";
  formData.website = "";
  formData.email = "";
  formData.phoneNumber = "";
  formData.address = "";
  files.value = null;
  validator.value?.clearErrors?.();
};

const close = () => {
  emit("update:open", false);
  resetForm();
};
</script>

<template>
  <div v-show="open" class="fixed   inset-0 z-50 bg-gray-500 bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl">
      <div class="flex justify-between items-center mb- ">
        <h2 class="text-xl font-[Moul] text-primary">{{ item ? "កែប្រែ" : "ចុះឈ្មោះ" }} ស្ថាប័ន</h2>
        <UButton @click="close" color="red">
          <TwFeather type="x" />
        </UButton>
      </div>
      <TwForm :name="formName" :class="{
        'tw-shake': isError,
      }" :rules="formRules" @submit="submit" :custom-field-name="{
        roleName: 'ឈ្មោះតួនាទី',
        roleDescription: 'ពិពណ៌នាតួនាទី',
      }" :get-on-watch-item="false">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <TwFile v-model="files" label="និមិត្តសញ្ញា" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="name" label="ឈ្មោះ" v-model="formData.name" required />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="website" label="គេហទំព័រ" v-model="formData.website" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="email" label="អ៊ីមែល" v-model="formData.email" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="phoneNumber" label="លេខទូរស័ព្ទ" v-model="formData.phoneNumber" />
          </div>
          <div class="col-span-12">
            <TwTextarea name="address" label="អាសយដ្ឋាន" v-model="formData.address" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <UButton @click="close" color="gray" size="xl">បោះបង់</UButton>
          <UButton type="submit" color="primary" size="xl">{{ $t('action.save') }}</UButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>
