<script setup lang="ts">
import {
  useToast,
  TwButton,
  TwErrorMessage,
  useForm,
  TwForm,
  TwInput,
} from "vue3-tailwind";
import { reactive, computed, ref, nextTick } from "vue";
import { useRouter } from '#app';

const router = useRouter();
useHead({
  title: "ទម្រង់ចុះឈ្មោះសេវាកម្ម",
});
// Security
const readOnly = computed(() => checkIfPageReadOnly());
const canSave = computed(() => !readOnly.value);

const formName = 'serviceRegisterForm';

// Form Data based on Prisma Schema
const formData = reactive({
  nameKh: '',
  providingInstitution: '',
  purpose: '',
  legalBasis: '',
  eligibleClients: '',
  serviceStandard: '',
  requiredDocuments: '',
  feedback: '',
});

const isError = ref(false);
const toast = useToast();
const composableForm = useForm();
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

// Validation Rules
const formRules = {
  nameKh: ['string', 'required'],
  providingInstitution: ['string'],
  purpose: ['string'],
  legalBasis: ['string'],
  eligibleClients: ['string'],
  serviceStandard: ['string'],
  requiredDocuments: ['string'],
  feedback: ['string'],
};

// Submit Logic
async function submit() {
  if (!(await confirmDialog())) return;

  if (validator.value) {
    validator.value.clearErrors();
    await validator.value.validate();
    if (validator.value.fail()) {
      toast.error({
        message: validator.value.getErrorMessage(),
      });
      isError.value = true;
      setTimeout(() => { isError.value = false; }, 1000);
      return;
    }
  }

  // API call
  const { error } = await useFetch("/api/service/upsert", {
    method: "POST",
    body: JSON.stringify(formData),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "ការចុះឈ្មោះសេវាកម្មមិនបានជោគជ័យ",
    });
  } else {
    toast.success({
      message: "ការចុះឈ្មោះសេវាកម្មបានជោគជ័យ",
    });
    clearForm();
    router.back();
  }
}

// Clear Form Logic
const clearForm = () => {
  Object.keys(formData).forEach(key => {
    (formData as any)[key] = '';
  });
  nextTick(() => {
    if (validator.value) {
      validator.value.clearErrors();
    }
  });
};
</script>

<template>
  <div>
    <h1 class="text-2xl font-[Moul] text-primary mb-3">
      ទម្រង់ចុះឈ្មោះសេវាកម្ម
    </h1>

    <TwForm :name="formName"
      class="grid grid-cols-12 gap-4 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-4 shadow"
      :class="{ 'tw-shake': isError }" :rules="formRules" @submit="submit" :custom-field-name="{
        nameKh: 'ឈ្មោះសេវា',
        providingInstitution: 'ក្រសួង/ស្ថាប័ន ផ្តល់សេវា',
        purpose: 'គោលបំណង នៃការផ្តល់សេវា',
        legalBasis: 'មូលដ្ឋានគតិយុត្ត',
        eligibleClients: 'អតិថិជនដែលមាន សិទ្ធិទទួលសេវា',
        serviceStandard: 'ស្តង់ដារសេវា',
        requiredDocuments: 'តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា',
        feedback: 'យោបល់',
      }">
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ឈ្មោះសេវា" name="nameKh" v-model="formData.nameKh" placeholder="ឈ្មោះសេវា" required
          :disabled="readOnly" />
        <CustomErrorMessage name="nameKh" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ក្រសួង/ស្ថាប័ន ផ្តល់សេវា" name="providingInstitution" v-model="formData.providingInstitution"
          placeholder="ក្រសួង/ស្ថាប័ន ផ្តល់សេវា" :disabled="readOnly" />
        <CustomErrorMessage name="providingInstitution" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="គោលបំណង នៃការផ្តល់សេវា" name="purpose" v-model="formData.purpose"
          placeholder="គោលបំណង នៃការផ្តល់សេវា" :disabled="readOnly" />
        <CustomErrorMessage name="purpose" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="មូលដ្ឋានគតិយុត្ត" name="legalBasis" v-model="formData.legalBasis" placeholder="មូលដ្ឋានគតិយុត្ត"
          :disabled="readOnly" />
        <CustomErrorMessage name="legalBasis" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="អតិថិជនដែលមាន សិទ្ធិទទួលសេវា" name="eligibleClients" v-model="formData.eligibleClients"
          placeholder="អតិថិជនដែលមាន សិទ្ធិទទួលសេវា" :disabled="readOnly" />
        <CustomErrorMessage name="eligibleClients" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ស្តង់ដារសេវា" name="serviceStandard" v-model="formData.serviceStandard"
          placeholder="ស្តង់ដារសេវា" :disabled="readOnly" />
        <CustomErrorMessage name="serviceStandard" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា" name="requiredDocuments" v-model="formData.requiredDocuments"
          placeholder="តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា" :disabled="readOnly" />
        <CustomErrorMessage name="requiredDocuments" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput label="យោបល់" name="feedback" v-model="formData.feedback" placeholder="យោបល់" :disabled="readOnly" />
        <CustomErrorMessage name="feedback" />
      </div>

      <div class="col-span-12 flex justify-end gap-2 mt-4">
        <UButton color="gray" type="button" @click="clearForm()" :disabled="readOnly">
          កំណត់ឡើងវិញ
        </UButton>
        <UButton v-if="canSave" color="primary" type="submit">
          រក្សាទុក
        </UButton>
      </div>
    </TwForm>
  </div>
</template>