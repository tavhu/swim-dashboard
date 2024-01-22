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
import  orgType  from '~~/store/data/orgType'
import  city  from '~~/store/data/address'

const { data : userDataAuth } = useAuth() 

useHead({
  title: "ចុះឈ្មោះមណ្ឌល",
});

let readOnly = checkIfPageReadOnly()
const route = useRoute()
const edit = route?.query?.id

const compute = computed(()=>route?.query?.id)
watch(compute,async ()=>{
    // window.location.reload()
    navigateTo('/center?id' + route?.query?.id)
})

const config = useRuntimeConfig()
const toast = useToast()
const composableForm = useForm()
const formName = "center"
const formData: {
  [key: string]: any;
} = reactive({
  id : edit ? edit : 'asdf' ,
  nameKH : '',
  nameEN : '',
  type : '',
  logo : '',
  directorName : '',
  phoneNumber : '',
  PoBox : '',
  email : '',
  website : '',
  locationMap : '',
  Address : '',
  City : '',
  District : '',
  overview : '',
  background : '',
  mission : '',
  vision : '',
  goal : '',
  ProjectSummary : '',
  status : true,
})
const formRules = { 
}
const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

const submit = async () =>{
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
  const oldImageURL = formData.logo  
  let image : any
  image = await handleImageUpload() 
  if(image){
    formData.logo = image[0]
    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method : 'POST' , body : JSON.stringify({imgURL : oldImageURL})})
  }

  console.log(formData.logo)
  const { error } = await useFetch("/api/center/upsert", {
    method: "POST",
    body: JSON.stringify({
      id :  formData.id ,
      nameKH : formData.nameKH , 
      nameEN : formData.nameEN , 
      type : formData.type , 
      logo : formData.logo , 
      directorName : formData.directorName , 
      phoneNumber : formData.phoneNumber , 
      PoBox : formData.PoBox , 
      email : formData.email , 
      website : formData.website , 
      locationMap : formData.locationMap , 
      Address : formData.Address , 
      City : formData.City,
      District : formData.District,
      overview : formData.overview , 
      background : formData.background , 
      mission : formData.mission , 
      vision : formData.vision , 
      goal : formData.goal , 
      ProjectSummary : formData.ProjectSummary , 
      status : formData.status , 
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
  }
};

const clear = () => {  
    if(readOnly) return;  
    formData.status = false
    files.value = null
    formData.id = null  
    formData.nameKH = null  
    formData.nameEN = null  
    formData.type = null  
    formData.logo = null  
    formData.directorName = null  
    formData.phoneNumber = null  
    formData.PoBox = null  
    formData.email = null  
    formData.website = null  
    formData.locationMap = null  
    formData.Address = null  
    formData.City = null
    formData.District = null
    formData.overview = null  
    formData.background = null  
    formData.mission = null  
    formData.vision = null  
    formData.goal = null  
    formData.ProjectSummary = null  
  
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

    const { data } = await useFetch("/api/user/upload",{
      method: "POST",
      body: fd,
    });

    console.log("data from backend is ", data.value);   
    return data.value
  } catch (error) {
    console.log(error);
  }
};


const commute = ref()
const temCommuteList : any = ref([])
const SelectedCityValue = computed(()=>formData.City)

watch(SelectedCityValue,()=>{
  temCommuteList.value = []
  commute.value =  city.find((element: any) => {
    // console.log(element.name)
    return element.name === formData.City
  })?.ls.forEach((ele)=>{
    temCommuteList.value.push({
      label : ele.bn,
      value : ele.bn,
      disabled : true,
    })

    ele.c.forEach((item =>{
      temCommuteList.value.push({
        label :  " ( "  + item.cc + " ) "  + item.cn ,
        value : item.cn
      })
    }))
  })  
})

// edit part
const userProfile = ref()
const currentUser = ref(false)

if (edit) {
  userProfile.value = await useFetch('/api/center/get', { method : 'post', 
    body : JSON.stringify({
      id : edit
  })}) 

  formData.status = userProfile.value?.data?.status
  formData.id = userProfile.value?.data?.id
  formData.nameKH = userProfile.value?.data?.nameKH
  formData.nameEN = userProfile.value?.data?.nameEN
  formData.type = userProfile.value?.data?.type
  formData.logo = userProfile.value?.data?.logo
  formData.directorName = userProfile.value?.data?.directorName
  formData.phoneNumber = userProfile.value?.data?.phoneNumber
  formData.PoBox = userProfile.value?.data?.PoBox
  formData.email = userProfile.value?.data?.email
  formData.website = userProfile.value?.data?.website
  formData.locationMap = userProfile.value?.data?.locationMap
  formData.Address = userProfile.value?.data?.Address
  formData.City = userProfile.value?.data?.City
  formData.District = userProfile.value?.data?.District
  formData.overview = userProfile.value?.data?.overview
  formData.background = userProfile.value?.data?.background
  formData.mission = userProfile.value?.data?.mission
  formData.vision = userProfile.value?.data?.vision
  formData.goal = userProfile.value?.data?.goal
  formData.ProjectSummary = userProfile.value?.data?.ProjectSummary


  // //@ts-ignore
  // if(route?.query?.id === userDataAuth.value?.id){
  //   // console.log('current User')
  //   currentUser.value = true
  // }
}

let temCity : any = []

city.forEach(ele =>{
  temCity.push({
    label : ele.name,
    value : ele.name
  })
})

const cityList = ref(temCity)

</script> 
<template>
  <div>            
    <h2 class="text-2xl font-[Moul] text-primary"> {{ edit ?  `កែព័ត៌មានមណ្ឌល` : `ចុះឈ្មោះមណ្ឌល`}} </h2>   
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
        <div class="col-span-12 flex justify-start  gap-3 mb-5">
          <TwFeather type="file-text" /> <h1 class="text-lg"> ព័ត៌មានលំអិត </h1>
        </div>
        <div class="col-span-12 lg:col-span-6">          
          <div class="vt-relative vt-col-span-12 vt-flex vt-items-center vt-justify-center">
            <div class="vt-relative vt-w-96">
              <img :src="config.public.origin + '/' + (formData.logo ? formData.logo : '') "  :class="(files?.length > 0 ? ' hidden '  : ' ') + ' vt-object-cover vt-rounded vt-bg-white dark:vt-bg-gray-900 vt-shadow vt-border dark:vt-border-gray-700 ' " alt="">
            </div>
          </div>
          <TwFile v-model="files" label="រូបភាព Logo" />
        </div>
        <div class="cols-span-12"></div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="ឈ្មោះជាភាសារខ្មែរ"
            name="nameKH"
            v-model="formData.nameKH"
            placeholder="ឈ្មោះជាភាសារខ្មែរ"
            type="text"
          />
          <CustomErrorMessage name="nameKH" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="ឈ្មោះជាភាសារអង់គ្លេស"
            name="nameEN"
            v-model="formData.nameEN"
            placeholder="ឈ្មោះជាភាសារអង់គ្លេស"
            type="text"
          />
          <CustomErrorMessage name="nameEN" />
        </div>       
        <div class="col-span-12 lg:col-span-6" >
          <TwSelect
            :disabled="readOnly"
            label="ប្រភេទអង្គភាព"
            name="type"            
            v-model="formData.type"
            :items="orgType"
            placeholder="សូមជ្រើសរើស"           
          />
          <CustomErrorMessage name="type" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="user" /> <h1 class="text-lg"> ព័ត៌មានទំនាក់ទំនង </h1>
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="ឈ្មោះនាយក"
            name="directorName"
            v-model="formData.directorName"
            placeholder="ឈ្មោះនាយក"
            type="text"
          />
          <CustomErrorMessage name="directorName" />
        </div>   

        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="លេខទូរស័ព្ទ"
            name="phoneNumber"
            v-model="formData.phoneNumber"
            placeholder="លេខទូរស័ព្ទ"
            type="text"
          />
          <CustomErrorMessage name="phoneNumber" />
        </div>           
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="Po Box"
            name="PoBox"
            v-model="formData.PoBox"
            placeholder="Po Box"
            type="text"
          />
          <CustomErrorMessage name="PoBox" />
        </div>           
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="អុីមែល"
            name="email"
            v-model="formData.email"
            placeholder="អុីមែល"
            type="text"
          />
          <CustomErrorMessage name="email" />
        </div>  
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="គេហទំព័រ"
            name="website"
            v-model="formData.website"
            placeholder="គេហទំព័រ"
            type="text"
          />
          <CustomErrorMessage name="website" />
        </div>  
        <div class="col-span-12 lg:col-span-6">
          <TwInput
            label="ទីតាំក្នុង Google Map"
            name="locationMap"
            v-model="formData.locationMap"          
            placeholder="ទីតាំក្នុង Google Map"
            type="text"
          />
          <CustomErrorMessage name="locationMap" />
        </div>  
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="map-pin" /> <h1 class="text-lg"> អាសយដ្ឋាន </h1>
        </div>       
        <div class="col-span-12 lg:col-span-6" >
            <TwSelect
              
              :disabled="readOnly"
              label="រាជធានី/ខេត្ត"
              name="city"            
              v-model="formData.City"
              required                    
              :items="cityList"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="type" />
            
          </div>  
          <div class="col-span-12 lg:col-span-6">
            <TwInput
              label="អាសយដ្ឋាន"
              name="address"
              v-model="formData.address"
              placeholder="ផ្ទះលេខ ផ្លូវលេខ ភូមិ"
              type="text"
            />
            <CustomErrorMessage name="address" />
          </div> 
          <div class="col-span-12 lg:col-span-6" >
            <label for="" class=" font-bold">
              ឃុំ/សង្កាត់   
            </label>
              <ClientOnly>
              <USelect
                :disabled="readOnly"            
                name="city"           
                required
                v-model="formData.District"
                :options="temCommuteList"
                placeholder="សូមជ្រើសរើស"     
                size="lg"      
              />
            </ClientOnly>
              <CustomErrorMessage name="type" />
          </div>    

          <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
            <TwFeather type="droplet" />  <h1 class="text-lg font-bold"> ទិដ្ឋភាពទូទៅ </h1>
          </div>           
          <div class="col-span-12">
            <TwTextarea             
              name="overview"                           
              v-model="formData.overview"             
              placeholder="បញ្ចូលទិដ្ឋភាពទូទៅ"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="overview" />
        </div>  
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="loader" />  <h1 class="text-lg font-bold"> ប្រវត្តិសាស្ត្រ </h1>
        </div>           
          <div class="col-span-12">
            <TwTextarea             
              name="background"                           
              v-model="formData.background"             
              placeholder="បញ្ចូលប្រវត្តិសាស្ត្រ"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="background" />
        </div>  
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="send" />  <h1 class="text-lg font-bold"> បេសកកម្ម </h1>
        </div>           
        <div class="col-span-12">
            <TwTextarea             
              name="mission"                           
              v-model="formData.mission"             
              placeholder="បញ្ចូលបេសកកម្ម"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="mission" />
        </div>   
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="award" />  <h1 class="text-lg font-bold"> ចក្ខុវិស័យ </h1>
        </div>           
        <div class="col-span-12">
            <TwTextarea             
              name="vision"                           
              v-model="formData.vision"             
              placeholder="បញ្ចូលចក្ខុវិស័យ"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="vision" />
        </div>       
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="navigation" />  <h1 class="text-lg font-bold"> គោលដៅ </h1>
        </div>           
        <div class="col-span-12">
            <TwTextarea             
              name="goal"                           
              v-model="formData.goal"             
              placeholder="បញ្ចូលគោលដៅ"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="goal" />
        </div>       
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="message-circle" />  <h1 class="text-lg font-bold"> សង្ខេប​គម្រោង </h1>
        </div>           
        <div class="col-span-12">
            <TwTextarea             
              name="ProjectSummary"                           
              v-model="formData.ProjectSummary"             
              placeholder="បញ្ចូលសង្ខេប​គម្រោង"
              class="h-[5rem]"
              type="text"
            />
          <CustomErrorMessage name="ProjectSummary" />
        </div>    
        <div class="col-span-12" >
          <TwToggle
            label="Status"
            name="status"
            id="toggle"
            :disabled="readOnly || currentUser"
            v-model="formData.status"           
          />
          <CustomErrorMessage name="status" />
        </div>
        <div class="col-span-12 flex justify-end gap-1 ">
          <UButton
           :disabled="readOnly"
            color="gray"
            type="button"
            square
            size="lg"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
            @click="clear()"
          >
            កំណត់ឡើងវិញ
          </UButton>
          <UButton color="primary" type="submit"  size="lg" class="px-4" :disabled="readOnly"> រក្សាទុក </UButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>
