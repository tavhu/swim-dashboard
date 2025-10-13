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
  <div v-if="open" class="fixed   inset-0 z-50 bg-gray-500 bg-opacity-50 flex items-center justify-center">
    <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-5xl">
      <div class="flex justify-between items-center mb- ">
        <h2 class="text-xl font-[Moul] text-primary">{{ item ? "កែប្រែ" : "ចុះឈ្មោះ" }} អង្គភាព</h2>
        <UButton @click="close" color="red">
          <TwFeather type="x" />
        </UButton>
      </div>
      <TwForm :name="formName" @submit="submit">
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
          <UButton type="submit" color="primary" size="xl">រក្សាទុក</UButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>
