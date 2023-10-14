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
DropdownItem,
} from "vue3-tailwind";

const toast = useToast();
const composableForm = useForm();
const formName = "User";

const formData: {
  [key: string]: any;
} = reactive({
  firstname: null,
  lastname: null,
  username: null,
  password: null,
  conPassword: null,
  image: null,
  userRoleID: "null",
  userOrgID: "null",
  status: false,
});


const usernameDuplicated = ref(false)
const formRules = {
  firstname: ["string"],
  lastname: ["string"],
  username: ["required", "string" , (value : string)=>{
    if(usernameDuplicated.value){
      return `ឈ្មោះគណនីត្រូវបានប្រើប្រាស់រួចហើយ`; 
    }
  }],
  password: [
    "required",
    "string",
    "test",
    (value: string) => {
      const MIN_LENGTH = 8;
      if (!value || value?.length < MIN_LENGTH) {
        return `តិចបំផុត​៨តួអក្សរ ${MIN_LENGTH}, ប្រវែងបច្ចុប្បន្នគឺ ${value?.length}`;
      }
    },
  ],
  conPassword : ["test",
    (value : string) =>{
      if(value !== formData.password){
        return "លេខសំងាត់មិនដូចគ្នា"
      }
    }
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

  let image : any
  image = await handleImageUpload() 
  

  if(image) formData.image = image[0]

  console.log(formData.image)
  const { error } = await useFetch("/api/user/upsert", {
    method: "POST",
    body: JSON.stringify({
      firstname : formData.firstname,
      lastname : formData.lastname,
      username : formData.username,
      password : formData.password,
      image : formData.image,
      status : formData.status,
      userRoleID : formData.userRoleID,
      userOrgID : formData.userOrgID,
    }),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "មិនឈោកជ័យ",
    });
  } else {
    toast.success({
      message: "ជោកជ័យ",
    });
    clear();
  }
};

const clear = () => {
  (formData.firstname = null),
    (formData.lastname = null),
    (formData.username = null),
    (formData.password = null),
    (formData.image = null),
    formData.conPassword,
    (formData.status = false),
    (files.value = null);
  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};

const files = ref();
const handleImageUpload = async () => {
  
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

    // console.log("data from backend is ", data.value);
    return data.value
  } catch (error) {
    console.log(error);
  }
};


const {data : roleData  } = await useFetch("/api/role/get",{ method : 'get'})
const roleDataFormat : DropdownItem [] = new Array({ label : '', value: ''})
roleDataFormat.pop()
//@ts-ignored
roleData.value?.data?.forEach((ele : any) => {
  roleDataFormat.push(
    {
      label: ele?.name,
      value: ele?.id
    }
  )
});

let timemer  = 0

const checkData = async ()=>{     
  clearTimeout(timemer)

   timemer = window.setTimeout(async ()=>{
      const {data : res } = await useFetch('/api/user/checkUsername',{method : 'POST',
      body: JSON.stringify({
          username: formData.username
      })})
      if(res.value){
        usernameDuplicated.value = true
      }else{
        usernameDuplicated.value = false
      }
      formData.username = formData.username + " "
      setTimeout(()=>{
         formData.username = formData.username.slice(0, -1);
      },1)

      //check username after stop type for 0.5sec
    
  },500)
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
          'tw-shake': isError,
        }"
        :rules="formRules"
        @submit="submit"
        :custom-field-name="{
          roleName: 'ឈ្មោះតួនាទី',
          roleDescription: 'ពិពណ៌នាតួនាទី',
        }"
      >
        <div class="col-span-12">
          <TwFile v-model="files"  label="រូបភាព Profile" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="នាមខ្លួន"
            name="firstname"
            v-model="formData.firstname"
            placeholder="Given Name"
            type="text"
          />
          <CustomErrorMessage name="firstname" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="នាមត្រគោល"
            name="lastname"
            v-model="formData.lastname"
            placeholder="Family Name"
            type="text"
          />
          <CustomErrorMessage name="lastname" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="ឈ្មោះគណនី"
            name="username"
            v-model="formData.username"
            @keydown="checkData"
            placeholder="Username"
          />
          <CustomErrorMessage name="username" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="លេខសំងាត់"
            name="password"
            type="password"
            v-model="formData.password"
            placeholder="Password"
          />
          <CustomErrorMessage name="password" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="លេខសំងាត់ម្តងទៀត"
            name="conPassword"
            type="password"
            v-model="formData.conPassword"
            placeholder="Confirm Password"
          />
          <CustomErrorMessage name="conPassword" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwSelect
            label="សិទ្ធិអ្នកប្រើប្រាស់"
            name="role"
            v-model="formData.userRoleID"
            :items="roleDataFormat"
            placeholder="Choose select"
          />
          <CustomErrorMessage name="role" />
        </div>
         <div class="col-span-12 lg:col-span-6">
            <TwSelect
              label="ជ្រើសរើសស្ថាប័ន្ត"
              name="userOrgID"
              v-model="formData.userOrgID"
              :items="[]"
              placeholder="Choose select"
            />
            <CustomErrorMessage name="userOrgID" />
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