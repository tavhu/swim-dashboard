<script setup lang="ts">
import {
  useToast,
  TwButton,
  TwErrorMessage,
  useForm,
  TwFile,
  TwForm,
  TwInput,
  TwSelect
} from "vue3-tailwind";
import { type ServiceCenter } from '@prisma/client'
import { onMounted, computed } from "vue";
import { usePermissionStore } from '~/stores/permission';

const permissionStore = usePermissionStore();
// RE-IMPLEMENTED: Check for 'read' permission, which the backend uses for authorization.
const canSave = computed(() => permissionStore.hasReadPermission('center-plan'));

// RE-IMPLEMENTED: The page is read-only if the user cannot save. This fixes a bug where
// an undefined function was being called.
const readOnly = computed(() => !canSave.value);

const { data: userDataAuth } = useAuth()
const user = computed(() => userDataAuth.value?.user) as any;
const formName = 'centerPlanForm'

const formData: {
  [key: string]: any;
} = reactive({
  actvityPlan: '',
  note: '',
  yearPlan: '',
  filePath: '',
  serviceCenterID: '',
});

const { data } = await useFetch<{ data: ServiceCenter[] }>('/api/center/get', {
  method: 'POST'
})

let serviceCenterList: any = []
data.value?.data.forEach(ele => {
  serviceCenterList.push({
    label: ele.nameKH,
    value: ele.id
  })
})

const isCenterUser = computed(() => !!user.value?.serviceCenterID);

onMounted(() => {
  if (isCenterUser.value) {
    formData.serviceCenterID = user.value.serviceCenterID;
  }
});

const isError = ref(false);
const toast = useToast();
const composableForm = useForm();
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

const formRules = {
  actvityPlan: ['string', 'required'],
  yearPlan: ['string', 'required'],
  serviceCenterID: ['string', 'required'],
}

async function submit() {
  if (!(await confirmDialog())) return;
  validator.value.clearErrors();
  await validator.value.validate();
  if (validator.value.fail()) {
    toast.error({
      message: validator.value.getErrorMessage(),
    });
    isError.value = true;
    setTimeout(() => {
      isError.value = false;
    }, 1000);
    return true;
  }

  const fileUploaded = await handleImageUpload()
  if (fileUploaded) {
    const filePaths = Object.values(fileUploaded);
    formData.filePath = filePaths.join(",");
  }

  const { error } = await useFetch("/api/center/plan/upsert", {
    method: "POST",
    body: JSON.stringify({
      actvityPlan: formData.actvityPlan,
      note: formData.note,
      yearPlan: formData.yearPlan,
      filePath: formData.filePath,
      serviceCenterID: formData.serviceCenterID,
    }),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "មិនជោគជ័យ",
    });
  } else {
    toast.success({
      message: "ជោគជ័យ",
    });
    clearForm();
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

    return data.value
  } catch (error) {
    console.log(error);
  }
}

const clearForm = () => {
  formData.actvityPlan = '';
  formData.note = '';
  formData.yearPlan = '';
  formData.filePath = '';
  files.value = null;
  validator.value.clearErrors();
  if (!isCenterUser.value) {
    formData.serviceCenterID = '';
  }
};

</script>
<template>
  <div>
    <div>
      <h1 class="text-2xl font-[Moul] text-primary mb-3">
        ផែនការសកម្មភាពមជ្ឈមណ្ឌល
      </h1>
    </div>

    <TwForm :name="formName"
      class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
      :class="{
        'tw-shake': isError,
      }" :rules="formRules" @submit="submit()" :custom-field-name="{
  actvityPlan: 'ផែនការសកម្មភាព',
  yearPlan: 'ផែនការឆ្នាំ',
  serviceCenterID: 'មណ្ឌល'
}">
      <div class="col-span-12 mb-5">
        <h1 class="text-lg"> សកម្មភាពការងារ </h1>
      </div>


      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="មណ្ឌល" name="serviceCenterID" v-model="formData.serviceCenterID" required
          :items="serviceCenterList" placeholder="សូមជ្រើសរើស" :disabled="isCenterUser" />
        <CustomErrorMessage name="serviceCenterID" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwSelect label="ផែនការសកម្មភាព" name="actvityPlan" required v-model="formData.actvityPlan" :items="[{
          value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ'
        },
        { value: 'threeyear', label: 'ផែនការមធ្យម' },
        { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
        ]" placeholder="សូមជ្រើសរើស" />

        <CustomErrorMessage name="actvityPlan" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="កំណត់ចំណាំ" name="note" v-model="formData.note" placeholder="កំណត់ចំណាំ" type="text" />
        <CustomErrorMessage name="note" />
      </div>
      <div class="col-span-12 lg:col-span-6">
        <TwInput label="ផែនការឆ្នាំ" name="yearPlan" v-model="formData.yearPlan" placeholder="YYYY" type="text" />
        <CustomErrorMessage name="yearPlan" />
      </div>
      <div class="col-span-12" v-if="canSave">
        <TwForm_custom v-model="files" :multiple='true' label="ឯកសារ" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" />
      </div>
      <div class="col-span-12 flex justify-end gap-1 ">
        <UButton color="gray" type="button" square size="lg"
          class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearForm()">
          កំណត់ឡើងវិញ
        </UButton>
        <UButton v-if="canSave" color="primary" type="submit" size="lg" class="px-4"> រក្សាទុក
        </UButton>
      </div>
    </TwForm>
  </div>
</template>