<script setup lang="ts">
import {
  useToast,
  TwButton,
  TwErrorMessage,
  useForm,
  TwForm,
  TwInput,
} from "vue3-tailwind";
import { reactive, computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from '#app';

const route = useRoute();
const router = useRouter();
const serviceId = route.params.id as string;

// Security
const readOnly = computed(() => checkIfPageReadOnly());
const canSave = computed(() => !readOnly.value);

const formName = 'serviceEditForm';

// Form Data based on Prisma Schema
const formData = reactive({
  id: serviceId,
  nameKh: '',
  nameEn: '',
  providingInstitution: '',
  purpose: '',
  legalBasis: '',
  eligibleClients: '',
  serviceStandard: '',
  requiredDocuments: '',
  feedback: '',
});

// Fetch existing data
onMounted(async () => {
    const { data: service, error } = await useFetch(`/api/service/${serviceId}`);
    if (error.value || !service.value) {
        toast.error({ message: 'Failed to load service data.' });
        router.back();
    } else {
        Object.assign(formData, service.value.data);
    }
});

const isError = ref(false);
const toast = useToast();
const composableForm = useForm();
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

// Validation Rules
const formRules = {
  nameKh: ['string', 'required'],
  nameEn: ['string'],
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
  
  if(validator.value) {
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

  // API call (using the existing upsert endpoint)
  const { error } = await useFetch("/api/service/upsert", {
    method: "POST",
    body: JSON.stringify(formData),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "ការកែប្រែសេវាកម្មមិនបានជោគជ័យ",
    });
  } else {
    toast.success({
      message: "ការកែប្រែសេវាកម្មបានជោគជ័យ",
    });
    router.push('/service');
  }
}

</script>

<template>
  <div>
    <h1 class="text-2xl font-[Moul] text-primary mb-3">{{ tr('ទម្រង់កែប្រែសេវាកម្ម') }}</h1>

    <TwForm
      :name="formName"
      class="grid grid-cols-12 gap-4 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-4 shadow"
      :class="{ 'tw-shake': isError }"
      :rules="formRules"
      @submit="submit"
      :custom-field-name="{
        nameKh: 'ឈ្មោះសេវា',
        nameEn: 'ឈ្មោះសេវា (អង់គ្លេស)',
        providingInstitution: 'ក្រសួង/ស្ថាប័ន ផ្តល់សេវា',
        purpose: 'គោលបំណង នៃការផ្តល់សេវា',
        legalBasis: 'មូលដ្ឋានគតិយុត្ត',
        eligibleClients: 'អតិថិជនដែលមាន សិទ្ធិទទួលសេវា',
        serviceStandard: 'ស្តង់ដារសេវា',
        requiredDocuments: 'តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា',
        feedback: 'យោបល់',
      }"
    >
      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('ឈ្មោះសេវា')" name="nameKh" v-model="formData.nameKh" :placeholder="tr('ឈ្មោះសេវា')" required :disabled="readOnly" />
        <CustomErrorMessage name="nameKh" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('ឈ្មោះសេវា (អង់គ្លេស)')" name="nameEn" v-model="formData.nameEn" placeholder="English service name" :disabled="readOnly" />
        <CustomErrorMessage name="nameEn" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('ក្រសួង/ស្ថាប័ន ផ្តល់សេវា')" name="providingInstitution" v-model="formData.providingInstitution" :placeholder="tr('ក្រសួង/ស្ថាប័ន ផ្តល់សេវា')" :disabled="readOnly" />
        <CustomErrorMessage name="providingInstitution" />
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('គោលបំណង នៃការផ្តល់សេវា')" name="purpose" v-model="formData.purpose" :placeholder="tr('គោលបំណង នៃការផ្តល់សេវា')" :disabled="readOnly" />
        <CustomErrorMessage name="purpose" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('មូលដ្ឋានគតិយុត្ត')" name="legalBasis" v-model="formData.legalBasis" :placeholder="tr('មូលដ្ឋានគតិយុត្ត')" :disabled="readOnly" />
        <CustomErrorMessage name="legalBasis" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('អតិថិជនដែលមាន សិទ្ធិទទួលសេវា')" name="eligibleClients" v-model="formData.eligibleClients" :placeholder="tr('អតិថិជនដែលមាន សិទ្ធិទទួលសេវា')" :disabled="readOnly" />
        <CustomErrorMessage name="eligibleClients" />
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('ស្តង់ដារសេវា')" name="serviceStandard" v-model="formData.serviceStandard" :placeholder="tr('ស្តង់ដារសេវា')" :disabled="readOnly" />
        <CustomErrorMessage name="serviceStandard" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា')" name="requiredDocuments" v-model="formData.requiredDocuments" :placeholder="tr('តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា')" :disabled="readOnly" />
        <CustomErrorMessage name="requiredDocuments" />
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwInput :label="tr('យោបល់')" name="feedback" v-model="formData.feedback" :placeholder="tr('យោបល់')" :disabled="readOnly" />
        <CustomErrorMessage name="feedback" />
      </div>

      <div class="col-span-12 flex justify-end gap-2 mt-4">
        <UButton color="gray" type="button" @click="router.back()">
          Back
        </UButton>
        <UButton v-if="canSave" color="primary" type="submit">
          Save Changes
        </UButton>
      </div>
    </TwForm>
  </div>
</template>