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
import { array } from "zod";
import { type ServiceCenter, type Staff, type governStaff } from '@prisma/client'

const readOnly = checkIfPageReadOnly()
const { data: userDataAuth } = useAuth()
const formName = 'ផែនការសកម្មភាព'
const planing = ref('')//take serviceCenterID

const items = [
  [{
    label: 'ផែនការប្រចាំឆ្នាំ',
  },{
      label: 'ផែនការមធ្យម'
  },
  {
    label: 'ផែនការរយៈពេលវែង'
  }
]]

const formNameEditOfficial = "centerStaffFormOfficial";
const formDataEdit: {
  [key: string]: any;
} = reactive({
  id: 'asdf',
  planning : '',
  docNumber: '',
  year :'',
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

const isErrorEdit = ref(false);
const toast = useToast();
const composableForm = useForm();
const formEditOfficial = computed(() => composableForm.getForm(formNameEditOfficial));
const validatorEditOfficial = computed(() => formEditOfficial.value.validator);

const formRulesEditOfficial = {
//   firstNameKH: ['string', 'required'],
//   lastNameKH: ['string', 'required'],
//   firstNameEN: ['string', 'required'],
  planning: ['string', 'required'],
  serviceCenterID: ['string', 'required'],
}

async function submitEditOfficial() {
     if (!(await confirmDialog())) return;
  validatorEditOfficial.value.clearErrors();
  await validatorEditOfficial.value.validate();
  if (validatorEditOfficial.value.fail()) {
    toast.error({
      message: validatorEditOfficial.value.getErrorMessage(),
    });
    isErrorEdit.value = true;
    setTimeout(() => {
      isErrorEdit.value = false;
    }, 1000);
    return true;
  }
  const fileUploaded =  await handleImageUpload()
}

const files = ref();
const handleImageUpload = async () => {
  if (readOnly) return;
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

    console.log("data from backend is ", data.value);   
    return data.value
  } catch (error) {
    console.log(error);
  }
}
</script>
<template>
    <div>

        <div>
            <h1 class="text-2xl font-[Moul] text-primary mb-3">
                ផែនការសកម្មភាពមជ្ឈមណ្ឌល
            </h1>
        </div>
        <!-- <table>
            <th>
            <td> លេខរៀង </td>
            <td> សកម្មភាពការងារ </td>
            <td> ពេលវេលាអនុវត្តសកម្មភាព </td>
            </th>
        </table> -->

         <TwForm :name="formNameEditOfficial"
              class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
              :class="{
            'tw-shake': isErrorEdit,
            }" :rules="formRulesEditOfficial" @submit="submitEditOfficial()" :custom-field-name="{
            roleName: 'ឈ្មោះតួនាទី',
            roleDescription: 'ពិពណ៌នាតួនាទី',
            }">
            <div class="col-span-12 mb-5">
                <!-- flex justify-start  gap-3 mb-5 -->
                <h1 class="text-lg"> សកម្មភាពការងារ </h1>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <TwSelect label="មណ្ឌល" name="serviceCenterID"  v-model="formDataEdit.serviceCenterID" required
                :items="serviceCenterList" placeholder="សូមជ្រើសរើស" />
              <CustomErrorMessage name="serviceCenterID" />
            </div>
            <div class="col-span-12 lg:col-span-6">
                    <!-- <UDropdown label="ផែនការសកម្មភាព" name="typeDrugUsed" v-model="planing"  :items="[{
                        value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ'
                    },
                    { value: 'threeyear', label: 'ផែនការមធ្យម' },
                    { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
                    ]" placeholder="សូមជ្រើសរើស" />

                    </UDropdown> -->
                    <TwSelect
                    label="ផែនការសកម្មភាព"
                    name="planning"
                    required
                    v-model="formDataEdit.planning"  
                    :items="[{
                        value: 'yearly', label: 'ផែនការប្រចាំឆ្នាំ'
                    },
                    { value: 'threeyear', label: 'ផែនការមធ្យម' },
                    { value: 'longterm', label: 'ផែនការរយៈពេលវែង' },
                    ]" placeholder="សូមជ្រើសរើស"         
                    />

                    <CustomErrorMessage name="planning" />
            </div>
             <div class="col-span-12 lg:col-span-6">
                <TwInput label="លេខសំគាល់"  name="lastNameKH" v-model="formDataEdit.docNumber"
                  placeholder="ឈ្មោះឬលេខឯកសារ" type="text" />
                <CustomErrorMessage name="lastNameKH" />
              </div>
             <div class="col-span-12 lg:col-span-6">
                <TwInput label="ផែនការឆ្នាំ" name="lastNameKH"  v-model="formDataEdit.year"
                  placeholder="លេខ" type="text" />
                <CustomErrorMessage name="lastNameKH" />
              </div>
            <!-- <div class="col-span-12 lg:col-span-6">
                <TwInput label="លេខរៀង" name="ReadableCode" placeholder="លេខរៀង" t  ype="text" />
                <CustomErrorMessage name="ReadableCode" />
            </div> -->
            <div class="col-span-12">
              <formTwForm_custom v-model="files" :multiple='true'  label="ឯកសារ"  />
            </div>
            <div class="col-span-12 flex justify-end gap-1 ">
                <UButton color="gray" type="submit" square size="lg"
                    class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="">
                    កំណត់ឡើងវិញ
                </UButton>
                <UButton color="primary" type="submit" size="lg" class="px-4"> រក្សាទុក
                </UButton>
            </div>
        </TwForm>
    </div>
</template>