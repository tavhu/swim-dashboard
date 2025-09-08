<script setup lang="ts">
import { useToast, TwFile, TwForm, TwInput, TwSelect, useForm, TwErrorMessage } from "vue3-tailwind";
import { type ServiceCenter } from '@prisma/client'
import { onMounted, computed, ref, nextTick, reactive, watch } from "vue";
import { usePermissionStore } from '~/stores/permission';
import { useRoute, useRouter } from '#app';

const router = useRouter();
const route = useRoute();
const permissionStore = usePermissionStore();

// --- Page Mode & Permissions --- //
const planId = computed(() => route.query.id as string | undefined);
const isEditMode = computed(() => !!planId.value);

const { data: userDataAuth } = useAuth();
const user = computed(() => userDataAuth.value?.user) as any;

const canSave = computed(() => {
  const permission = permissionStore.getPermission('center-plan');
  return permission?.read ?? true; 
});
const readOnly = computed(() => !canSave.value);

// --- Form State --- //
const formName = 'centerPlanForm';
const formData = reactive({
  id: undefined as string | undefined,
  actvityPlan: '',
  note: '',
  yearPlan: '',
  filePath: '',
  serviceCenterID: '',
});
const existingFiles = ref<string[]>([]);
const files = ref<File[]>([]); // For new file uploads

// --- Data Loading --- //
const { data: centerData } = await useFetch<{ data: ServiceCenter[] }>('/api/center/get', {
  method: 'POST'
});
const serviceCenterList = computed(() => 
  centerData.value?.data.map(ele => ({
    label: ele.nameKH,
    value: ele.id
  })) || []
);
const isCenterUser = computed(() => !!user.value?.serviceCenterID);

async function fetchPlanData(id: string) {
  try {
    const result = await $fetch<any>('/api/center/plan/get-by-id', {
      method: 'POST',
      body: { id },
    });
    if (result.plan) {
      formData.id = result.plan.id;
      formData.actvityPlan = result.plan.actvityPlan;
      formData.note = result.plan.note;
      formData.yearPlan = result.plan.yearPlan;
      formData.filePath = result.plan.filePath;
      formData.serviceCenterID = result.plan.serviceCenterID;
      existingFiles.value = result.plan.filePath ? result.plan.filePath.split(',').filter((f:string) => f) : [];
    } else {
      toast.error({ message: 'Plan not found.' });
      goBack();
    }
  } catch (e) {
    toast.error({ message: 'Failed to load plan data.' });
    goBack();
  }
}

onMounted(() => {
  if (isEditMode.value && planId.value) {
    fetchPlanData(planId.value);
  } else if (isCenterUser.value) {
    formData.serviceCenterID = user.value.serviceCenterID;
  }
});

watch(planId, (newId) => {
  if (!newId) {
    resetFormForNewEntry();
  }
});

// --- Form Validation --- //
const composableForm = useForm();
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);
const isError = ref(false);
const toast = useToast();
const formRules = {
  actvityPlan: ['string', 'required'],
  yearPlan: ['string', 'required'],
  serviceCenterID: ['string', 'required'],
};

// --- Form Actions --- //
const goBack = () => {
  router.push('/center/centerdocumentation');
};

const resetFormForNewEntry = () => {
  formData.id = undefined;
  formData.actvityPlan = '';
  formData.note = '';
  formData.yearPlan = '';
  formData.filePath = '';
  formData.serviceCenterID = isCenterUser.value ? user.value.serviceCenterID : '';
  files.value = [];
  existingFiles.value = [];
  nextTick(() => {
    validator.value?.clearErrors();
  });
}

const clearForm = () => {
  if (isEditMode.value && planId.value) {
    fetchPlanData(planId.value);
    files.value = [];
  } else {
    resetFormForNewEntry();
  }
}

async function submit() {
  if (!(await confirmDialog({ title: isEditMode.value ? 'Confirm Update' : 'Confirm Save' }))) return;
  
  if (!validator.value) return;
  await validator.value.validate();
  if (validator.value.fail()) {
    toast.error({ message: validator.value.getErrorMessage() });
    isError.value = true;
    setTimeout(() => { isError.value = false; }, 1000);
    return;
  }

  const uploadedFilePaths = await handleImageUpload();
  const newFilePaths = uploadedFilePaths ? Object.values(uploadedFilePaths) : [];
  
  const allFilePaths = [...existingFiles.value, ...newFilePaths];

  const payload = {
    serviceCenterID: formData.serviceCenterID,
    yearPlan: formData.yearPlan,
    actvityPlan: formData.actvityPlan,
    note: formData.note,
    filePath: allFilePaths.join(','),
    id: formData.id,
  };

  const { error } = await useFetch("/api/center/plan/upsert", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (error.value) {
    toast.error({ message: `Save failed: ${error.value.data?.message || 'An unknown error occurred.'}` });
  } else {
    toast.success({ message: "Save successful" });
    goBack();
  }
}

// --- File Handling --- //
const handleImageUpload = async () => {
  if (readOnly.value || files.value.length === 0) return false;
  try {
    const fd = new FormData();
    files.value.forEach((file, index) => {
      fd.append(String(index), file);
    });

    const { data } = await useFetch<Record<string, string>>("/api/user/upload", {
      method: "POST",
      body: fd,
    });
    return data.value;
  } catch (err) {
    console.error('File upload failed:', err);
    toast.error({ message: 'File upload failed.' });
    return null;
  }
};

function removeExistingFile(index: number) {
  existingFiles.value.splice(index, 1);
}

</script>

<template>
  <div>
    <h1 class="text-2xl font-[Moul] text-primary mb-3">
      {{ isEditMode ? 'កែសម្រួលផែនការសកម្មភាព' : 'ផែនការសកម្មភាពមជ្ឈមណ្ឌល' }}
    </h1>

    <TwForm :name="formName"
      class="grid grid-cols-12 gap-4 bg-white dark:bg-gray-900 rounded-lg p-4 shadow"
      :class="{ 'tw-shake': isError }"
      :rules="formRules"
      @submit="submit"
      :custom-field-name="{
        actvityPlan: 'ផែនការសកម្មភាព',
        yearPlan: 'ផែនការឆ្នាំ',
        serviceCenterID: 'មណ្ឌល'
      }">
      
      <div class="col-span-12">
        <h2 class="text-lg font-semibold">{{ isEditMode ? 'កែសម្រួលព័ត៌មាន' : 'សកម្មភាពការងារ' }}</h2>
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="មណ្ឌល" name="serviceCenterID" v-model="formData.serviceCenterID" required
          :items="serviceCenterList" placeholder="សូមជ្រើសរើស" :disabled="isCenterUser || readOnly" />
        <TwErrorMessage name="serviceCenterID" />
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="ផែនការសកម្មភាព" name="actvityPlan" required v-model="formData.actvityPlan" :items="[
          { value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ' },
          { value: 'threeyear', label: 'ផែនការមធ្យម' },
          { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
        ]" placeholder="សូមជ្រើសរើស" :disabled="readOnly" />
        <TwErrorMessage name="actvityPlan" />
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="កំណត់ចំណាំ" name="note" v-model="formData.note" placeholder="កំណត់ចំណាំ" type="text" :disabled="readOnly" />
        <TwErrorMessage name="note" />
      </div>
      
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ផែនការឆ្នាំ" name="yearPlan" v-model="formData.yearPlan" placeholder="YYYY" type="text" :disabled="readOnly" required />
        <TwErrorMessage name="yearPlan" />
      </div>

      <!-- File Upload Section -->
      <div class="col-span-12" v-if="canSave">
        <TwFile v-model="files" :multiple="true" label="បន្ថែមឯកសារថ្មី" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" :disabled="readOnly" />
      </div>

      <!-- Existing Files Display -->
      <div class="col-span-12" v-if="isEditMode && existingFiles.length > 0">
          <p class="font-medium mb-2">ឯកសារបច្ចុប្បន្ន:</p>
          <ul class="list-disc list-inside space-y-1">
              <li v-for="(file, index) in existingFiles" :key="index" class="flex items-center justify-between">
                  <a :href="file" target="_blank" class="text-blue-500 hover:underline truncate">{{ file.split('/').pop() }}</a>
                  <UButton v-if="canSave" icon="i-heroicons-x-mark-20-solid" color="red" variant="ghost" size="xs" @click="removeExistingFile(index)" />
              </li>
          </ul>
      </div>

      <!-- Action Buttons -->
      <div class="col-span-12 flex justify-end gap-2 mt-4">
        <UButton color="gray" type="button" @click="goBack()">ត្រឡប់ក្រោយ</UButton>
        <UButton v-if="canSave" color="gray" type="button" @click="clearForm()">{{ isEditMode ? 'បោះបង់' : 'កំណត់ឡើងវិញ' }}</UButton>
        <UButton v-if="canSave" color="primary" type="submit">{{ isEditMode ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'រក្សាទុក' }}</UButton>
      </div>
    </TwForm>
  </div>
</template>
