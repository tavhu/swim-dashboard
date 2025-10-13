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
  }
});

const files = ref();

const submit = async () => {
  const validation = await composableForm.getForm(formName).validator.validate();
  if (validation.fail()) {
    toast.error({ message: validation.getErrorMessage() });
    return;
  }

  let logo = formData.logo;
  if (files.value && files.value.length > 0) {
    const fd = new FormData();
    Array.from(files.value).forEach((file, index) => {
      fd.append(String(index), file as Blob);
    });
    const { data: uploadedFiles } = await useFetch("/api/user/upload", {
      method: "POST",
      body: fd,
    });
    if (uploadedFiles.value) {
      logo = (uploadedFiles.value as string[])[0];
    }
  }

  await useFetch("/api/organisation/upsert.post", {
    method: "POST",
    body: { ...formData, logo },
  });

  toast.success({ message: "Organisation saved successfully" });
  emit("update:open", false);
};

const close = () => {
  emit("update:open", false);
};
</script>

<template>
  <div
    class="fixed inset-0 z-40 bg-gray-900/50 transition-opacity"
    v-if="open"
    @click.self="close"
  ></div>
  <div
    class="fixed top-0 right-0 z-50 h-full w-full max-w-2xl transform bg-white p-6 shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-800"
    :class="open ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">{{ item ? "Edit" : "Create" }} Organisation</h2>
      <button @click="close">
        <TwFeather type="x" />
      </button>
    </div>
    <div class="overflow-y-auto h-full pb-20">
      <TwForm :name="formName" @submit="submit">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-12">
            <TwFile v-model="files" label="Logo" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="name" label="Name" v-model="formData.name" required />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="website" label="Website" v-model="formData.website" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput name="email" label="Email" v-model="formData.email" />
          </div>
          <div class="col-span-12 md:col-span-6">
            <TwInput
              name="phoneNumber"
              label="Phone Number"
              v-model="formData.phoneNumber"
            />
          </div>
          <div class="col-span-12">
            <TwTextarea name="address" label="Address" v-model="formData.address" />
          </div>
        </div>
        <div class="absolute bottom-0 left-0 w-full bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700">
            <div class="flex justify-end gap-2">
                <TwButton @click="close" variant="secondary" type="button">Cancel</TwButton>
                <TwButton type="submit">Save</TwButton>
            </div>
        </div>
      </TwForm>
    </div>
  </div>
</template>
