<script setup lang="ts">
useHead({
  title: "បង្កើតគណនី",
});
import {
  TwForm,
  TwButton,
  TwFile,
  TwInput,  
  TwSelect,
  TwToggle, 
  useToast,
  useForm,
} from "vue3-tailwind";

const toast = useToast();
const composableForm = useForm();
const formName = "User";

const formData: {
  [key: string]: any;
} = reactive({
  firstname: null,
  middlename: null ,
  lastname  : null ,
  username  : null ,
  password  : null ,
  conPassword: null,
  image     : null ,
  status : false,
});

const formRules = {
  firstname : ["string"],
  lastname: ["string"],
  username: ["required", "string"],
  password: [
      "required",
      "string",
      "test",
      (value: string) => {
        const MIN_LENGTH = 8;
        if (!value || value.length < MIN_LENGTH) {
          return `Min length is ${MIN_LENGTH}, current length is ${value.length}`;
        }
      },
    ], 
};

const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);


const submit = async () => {
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

  handleImageUpload()

  // const { error } = await useFetch("/api/role/create", {
  //   method: "POST",
  //   body: JSON.stringify({
  //     roleName: formData.roleName,
  //     description: formData.roleDescription,
  //   }),
  // });

  // if (error.value?.statusCode) {
  //   toast.error({
  //     message: "មិនឈោកជ័យ",
  //   });
  // } else {
  //   toast.success({
  //     message: "ជោកជ័យ",
  //   });
  //   clear();
  // }
  
}

const clear = () => {
  formData.firstname = null,
  formData.middlename = null,
  formData.lastname = null,
  formData.username = null,
  formData.password = null ,
  formData.image = null   ,
  formData.conPassword,
  formData.status = false,
  files.value = null
  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};


const files = ref();
const handleImageUpload = async () =>  {
  try {
    const fd = new FormData();
    Array.from(files.value).forEach((file , index) => {
      //@ts-ignore
      fd.append(index , file );  
    });

    const { data } = await useFetch('/api/user/upload',{
      method: 'POST',
      body: fd,
    });
    
    console.log('data from backend is ', data.value);
  } catch (error) {
    console.log(error);
  }
}

</script>

<template>
  <div>
    <h2 class="text-2xl font-bold font-[Moul]">បង្កើតគណនី</h2>
    <hr class="my-2 border dark:border-gray-700" />
    <div class="font-[Battambang]">
      <TwForm
        :name="formName"
        class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
        :class="{
          'tw-shake':isError,
        }"
        :rules="formRules"
        @submit="submit"
        :custom-field-name="{
          roleName: 'ឈ្មោះតួនាទី',
          roleDescription: 'ពិពណ៌នាតួនាទី',
        }"
      >
        <div class="col-span-12 ">
          <TwFile  v-model="files"  />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="នាមខ្លួន"
            name="firstname"
            v-model="formData.firstname"
            placeholder="First Name"
            type="text"
          />
          <CustomErrorMessage name="firstname" />
        </div>      
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="នាមត្រគោល"
            name="lastname"
            v-model="formData.lastname"
            placeholder="Last Name"
            type="text"
          />
          <CustomErrorMessage name="lastname" />
        </div>
       
        <div class="col-span-12">
          <TwInput
            label="ឈ្មោះគណនី"
            name="username"
            v-model="formData.username"
            :items="[]"
            placeholder="Username"
          />
          <CustomErrorMessage name="username" />
        </div>   
        <div class="col-span-12">
          <TwInput
            label="លេខសំងាត់"
            name="password"
            v-model="formData.password"
            :items="[]"
            placeholder="Password"
          />
          <CustomErrorMessage name="password" />
        </div>  
        <div class="col-span-12">
          <TwInput
            label="លេខសំងាត់ម្តងទៀត"
            name="conPassword"
            v-model="formData.conPassword"
            :items="[]"
            placeholder="Confirm Password"
          />
          <CustomErrorMessage name="conPassword" />
        </div>  

        <div class="col-span-12">
          <TwSelect
            label="សិទ្ធិអ្នកប្រើប្រាស់"
            name="role"
            v-model="formData.role"
            :items="[]"
            placeholder="Choose select"
          />
          <CustomErrorMessage name="role" />
        </div>   
          
        <div class="col-span-12">
          <TwToggle
            label="Status"
            name="status"
            id="toggle"
            v-model="formData.status"
          />
          <CustomErrorMessage name="status" />
        </div>
        <div class="col-span-12 flex justify-end gap-1">
          <TwButton
            ripple
            variant="secondary"
            type="button"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
            @click="clear()"
          >
            Reset
          </TwButton>
          <TwButton variant="primary" class="px-4"> Submit </TwButton>
        </div>
      </TwForm>
    </div>
  </div>

</template>
