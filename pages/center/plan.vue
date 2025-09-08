<script setup lang="ts">
import { useToast, TwFile, TwForm, TwInput, TwSelect } from "vue3-tailwind";
import { type ServiceCenter } from '@prisma/client'
import { onMounted, computed, ref, nextTick, reactive } from "vue";
import { usePermissionStore } from '~/stores/permission';
import { useRoute, useRouter } from '#app';

const router = useRouter();
const route = useRoute();
const permissionStore = usePermissionStore();

const planId = computed(() => route.query.id as string | undefined);
const isEditMode = computed(() => !!planId.value);

const isSaved = ref(false);

const goBack = () => {
  router.push('/center/centerdocumentation');
};

const canSave = computed(() => {
  const permission = permissionStore.getPermission('center-plan');
  // For now, let's assume read permission means can edit/create.
  // You might want to refine this based on your permission system (e.g., permission.create, permission.update)
  return permission?.read ?? true; 
});

const readOnly = computed(() => !canSave.value);

const { data: userDataAuth } = useAuth();
const user = computed(() => userDataAuth.value?.user) as any;
const formName = 'centerPlanForm';

const formData = reactive({
  id: undefined as string | undefined,
  actvityPlan: '',
  note: '',
  yearPlan: '',
  filePath: '',
  serviceCenterID: '',
});

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

const { useForm } = await import("vue3-tailwind");
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

async function fetchPlanData(id: string) {
  try {
    const result = await $fetch<any>('/api/center/plan/get-by-id', {
      method: 'POST',
      body: { id },
    });
    if (result.plan) {
      Object.assign(formData, result.plan);
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
  } else {
    // For create mode, set default service center if user is a center user
    if (isCenterUser.value) {
      formData.serviceCenterID = user.value.serviceCenterID;
    }
  }
});

const resetFormForNewEntry = () => {
  formData.id = undefined;
  formData.actvityPlan = '';
  formData.note = '';
  formData.yearPlan = '';
  formData.filePath = '';
  files.value = null;
  if (!isCenterUser.value) {
    formData.serviceCenterID = '';
  }
  nextTick(() => {
    validator.value?.clearErrors();
  });
}

const clearForm = () => {
  if (isEditMode.value) {
    // If editing, reset to original data
    if (planId.value) fetchPlanData(planId.value);
  } else {
    // If creating, just clear the form
    resetFormForNewEntry();
  }
}

async function submit() {
  if (!(await confirmDialog({ title: isEditMode.value ? 'Confirm Update' : 'Confirm Save' }))) return;
  
  validator.value.clearErrors();
  await validator.value.validate();
  if (validator.value.fail()) {
    toast.error({ message: validator.value.getErrorMessage() });
    isError.value = true;
    setTimeout(() => { isError.value = false; }, 1000);
    return;
  }

  const fileUploaded = await handleImageUpload();
  if (fileUploaded) {
    const filePaths = Object.values(fileUploaded);
    formData.filePath = filePaths.join(",");
  }

  const { error } = await useFetch("/api/center/plan/upsert", {
    method: "POST",
    body: formData, // Send the whole formData object, which includes the id for updates
  });

  if (error.value?.statusCode) {
    toast.error({ message: "Save failed" });
  } else {
    toast.success({ message: "Save successful" });
    goBack(); // Go back to the list after saving
  }
}

const files = ref();
const handleImageUpload = async () => {
  if (readOnly.value) return;
  if (!files.value || files.value?.length == 0) return false;
  try {
    const fd = new FormData();
    Array.from(files.value).forEach((file, index) => {
      //@ts-ignore
      fd.append(index, file);
    });

    const { data } = await useFetch("/api/user/upload", {
      method: "POST",
      body: fd,
    });

    return data.value;
  } catch (error) {
    console.log(error);
  }
}

</script>

<template>
  <div>
    <div>
      <h1 class="text-2xl font-[Moul] text-primary mb-3">
        {{ isEditMode ? 'កែសម្រួលផែនការសកម្មភាព' : 'ផែនការសកម្មភាពមជ្ឈមណ្ឌល' }}
      </h1>
    </div>

    <TwForm :name="formName"
      class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
      :class="{ 'tw-shake': isError }"
      :rules="formRules"
      @submit="submit"
      :custom-field-name="{
        actvityPlan: 'ផែនការសកម្មភាព',
        yearPlan: 'ផែនការឆ្នាំ',
        serviceCenterID: 'មណ្ឌល'
      }">
      
      <div class="col-span-12 mb-5">
        <h1 class="text-lg">{{ isEditMode ? 'កែសម្រួលព័ត៌មាន' : 'សកម្មភាពការងារ' }}</h1>
      </div>

      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="មណ្ឌល" name="serviceCenterID" v-model="formData.serviceCenterID" required
          :items="serviceCenterList" placeholder="សូមជ្រើសរើស" :disabled="isCenterUser || readOnly" />
        <CustomErrorMessage name="serviceCenterID" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="ផែនការសកម្មភាព" name="actvityPlan" required v-model="formData.actvityPlan" :items="[
          { value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ' },
          { value: 'threeyear', label: 'ផែនការមធ្យម' },
          { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
        ]" placeholder="សូមជ្រើសរើស" :disabled="readOnly" />
        <CustomErrorMessage name="actvityPlan" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="កំណត់ចំណាំ" name="note" v-model="formData.note" placeholder="កំណត់ចំណាំ" type="text" :disabled="readOnly" />
        <CustomErrorMessage name="note" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ផែនការឆ្នាំ" name="yearPlan" v-model="formData.yearPlan" placeholder="YYYY" type="text" :disabled="readOnly" />
        <CustomErrorMessage name="yearPlan" />
      </div>
      <div class="col-span-12" v-if="canSave">
        <TwFile v-model="files" :multiple="true" label="ឯកសារ" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" :disabled="readOnly" />
        <p v-if="isEditMode && formData.filePath" class="text-sm mt-2 text-gray-500">Current file: <a :href="formData.filePath" target="_blank" class="text-blue-500 hover:underline">{{ formData.filePath.split('/').pop() }}</a></p>
      </div>
      <div class="col-span-12 flex justify-end gap-1 ">
        <UButton color="gray" type="button" square size="lg"
          class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="goBack()">
          ត្រឡប់ក្រោយ
        </UButton>
        <UButton v-if="canSave" color="gray" type="button" square size="lg"
          class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearForm()">
          {{ isEditMode ? 'បោះបង់' : 'កំណត់ឡើងវិញ' }}
        </UButton>
        <UButton v-if="canSave" color="primary" type="submit" size="lg" class="px-4">
           {{ isEditMode ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'រក្សាទុក' }}
        </UButton>
      </div>
    </TwForm>
  </div>
</template>
