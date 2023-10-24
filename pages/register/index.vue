<script setup lang="ts">
import {
  TwForm,
  TwButton,
  TwFile,
  TwInput,
  TwSelect,
  TwToast,
  TwToggle,
  useToast,
  useForm,
  type DropdownItem,
} from "vue3-tailwind";

const { data : userDataAuth } = useAuth() 

useHead({
  title: "បង្កើតគណនី",
});

let readOnly = checkIfPageReadOnly()
const route = useRoute()
const edit = route?.query?.id

const compute = computed(()=>route?.query?.id)

watch(compute,async ()=>{
    window.location.reload() 
   
})

const config = useRuntimeConfig()
const toast = useToast()
const composableForm = useForm()
const formName = "User"
const formData: {
  [key: string]: any;
} = reactive({
  id : edit ? edit : 'asdf' ,
  firstname: null,
  lastname: null,
  username: null,
  password: null,
  conPassword: null,
  image: null,
  userRoleID: "null",
  userOrgID: "null",
  status: false,
})

const usernameDuplicated = ref(false)
const formRules = {
  userRoleID: ["required"],
  firstname: ["string"],
  lastname: ["string"],
  username:  ["required", "string" , (value : string)=>{
    if(usernameDuplicated.value){
      return `ឈ្មោះគណនីត្រូវបានប្រើប្រាស់រួចហើយ`; 
    }
  }],
  password: (!edit && !formData.password) ? [
    "required",
    "string",
    "test",
    (value: string) => {
      const MIN_LENGTH = 8;
      if (!value || value?.length < MIN_LENGTH) {
        return `តិចបំផុត​៨តួអក្សរ ${MIN_LENGTH}, ប្រវែងបច្ចុប្បន្នគឺ ${value?.length}`;
      }
    },
  ] : [],
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
  if(readOnly) return;
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

  const oldImageURL = formData.image
  
  let image : any
  image = await handleImageUpload() 
  if(image){
    formData.image = image[0]

    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method : 'POST' , body : JSON.stringify({imgURL : oldImageURL})})
  }

  console.log(formData.image)
  const { error } = await useFetch("/api/user/upsert", {
    method: "POST",
    body: JSON.stringify({
      id :  formData.id ,
      firstname : formData.firstname,
      lastname : formData.lastname,
      username : formData.username,
      password : formData.password ? formData.password : userProfile.value?.data?.password,
      image : formData.image,
      status : formData.status,
      userRoleID : formData.userRoleID,
      userOrgID : formData.userOrgID,
      updatePass : edit && formData.password ? true : false
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
  }
};

const clear = () => {  
    if(readOnly) return;
    formData.firstname = null
    formData.conPassword = null
    formData.lastname = null
    formData.username = null
    formData.password = null
    formData.image = null
    formData.conPassword = null
    formData.status = false
    files.value = null

  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};

const files = ref();
const handleImageUpload = async () => {  
  if(readOnly) return;
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


const {data : roleData  } = await useFetch("/api/role/get",{ method : 'get' , query : {
  //@ts-ignore
  userID : userDataAuth.value?.sub }
})
const roleDataFormat : DropdownItem [] = new Array({ label : '', value: ''})
roleDataFormat.pop()
//@ts-ignored
roleData.value?.data?.forEach((ele : any) => {
  if(readOnly) return;
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

/// edit part
const userProfile = ref()

if (edit) {
  userProfile.value = await useFetch('/api/user/checkUsername', { method : 'post', 
    body : JSON.stringify({
      id : edit
  })}) 
  formData.id = userProfile.value?.data?.id
  formData.firstname = userProfile.value?.data?.firstname
  formData.lastname = userProfile.value?.data?.lastname
  formData.username = userProfile.value?.data?.username
  formData.password = null
  formData.conPassword = null
  formData.image = userProfile.value?.data?.image 
  formData.userOrgID = userProfile.value?.data?.userOrgID
  formData.status = userProfile.value?.data?.status
  formData.userRoleID = userProfile.value?.data?.userRoleID


  if(!roleDataFormat.find(item => item.value == userProfile.value?.data?.userRoleID) && edit ){
    // console.log('should set to readonly')
    readOnly = true
  }
}

</script>

<template>
  <div>        
    <h2 class="text-2xl font-bold font-[Moul]"> {{ edit ?  `កែប្រែគណនី` : `បង្កើតគណនី`}} </h2>   
    <TwButton
      variant="danger" 
      class="font-[battambang]"      
      v-if="readOnly"      
      :disabled="true"
      >
       អ្ននគ្មានសិទ្ធកែប្រែ គណនីនេះទេ
      </TwButton>
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
          
          <div class="vt-relative vt-col-span-12 vt-flex vt-items-center vt-justify-center">
            <div class="vt-relative vt-w-96">
              <img :src="config.public.origin + '/' + (formData.image ? formData.image : '') "  :class="(files?.length > 0 ? ' hidden '  : ' ') + ' vt-object-cover vt-rounded vt-bg-white dark:vt-bg-gray-900 vt-shadow vt-border dark:vt-border-gray-700 ' " alt="">
            </div>
          </div>

          <TwFile v-model="files" label="រូបភាព Profile" />
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
            :label=" edit? 'លេខសំងាត់(ទុកឲ្យទទេបើមិនប្តូ)' : 'លេខសំងាត់'"
            name="password"
            type="password"
            v-model="formData.password"
            placeholder="Password"
          />
          <CustomErrorMessage name="password" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            :label="edit ? 'លេខសំងាត់ម្តងទៀត(ទុកឲ្យទទេបើមិនប្តូ)' : 'លេខសំងាត់ម្តងទៀត'"
            name="conPassword"
            type="password"
            v-model="formData.conPassword"
            placeholder="Confirm Password"
          />
          <CustomErrorMessage name="conPassword" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwSelect
            :disabled="readOnly"
            label="សិទ្ធិអ្នកប្រើប្រាស់"
            name="userRoleID"            
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
            :disabled="readOnly"
            v-model="formData.status"
          />
          <CustomErrorMessage name="status" />
        </div>
        <div class="col-span-12 flex justify-end gap-1">
          <TwButton
           :disabled="readOnly"
            variant="secondary"
            type="button"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
            @click="clear()"
          >
            Reset
          </TwButton>
          <TwButton variant="primary" class="px-4" :disabled="readOnly"> Submit </TwButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>