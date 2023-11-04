<script setup lang="ts">

import {
  useForm,
  TwInput,
  TwForm,
  TwSelect, 
  useToast,
  TwOffcanvas,
  TwToast
} from 'vue3-tailwind'
import { type ServiceCenter, type Staff}  from '@prisma/client'
import title from '~/store/data/title'

  const prop = defineProps<{
      openisTrue  : boolean ,          
      readOnly : boolean ,
      id : string | undefined | null,
      serviceCenterID : string | null
  }>()

  const emit = defineEmits<{     
      (event: 'canvasIsOpen', isOpen: boolean): void
    }>()


  let temTitle : any = []

  title.forEach(ele =>{
    temTitle.push({
        label : ele.name,
        value : ele.name
      })
    })
    
    const openisTrues = ref()    
    const formRulesEdit = {   
    title : ['string' , 'required'],
    firstName : ['string' , 'required'],
    lastName : ['string' , 'required'],
    gender : ['string'],
    position : ['string'],
    telephone : ['string'],
    email : ['string', 'email'],
    serviceCenterID : ['string','required'],
    };

    const formNameEdit = "centerStaffForm";
    const formDataEdit: {
    [key: string]: any;
    } = reactive({       
    id : prop.id ? prop.id : 'asdf' ,
    title  : null ,
    firstName  : null ,
    lastName  : null ,
    gender  : null ,
    position  : null ,
    telephone  : null ,
    email  : null ,
    serviceCenterID  : prop.serviceCenterID ? prop.serviceCenterID : '' ,
    });

    const toast = useToast();

    const {toasts : useToat} = useToast()
    
    const composableForm = useForm();
    const isErrorEdit = ref(false);
    const formEdit = computed(() => composableForm.getForm(formNameEdit));
    const validatorEdit = computed(() => formEdit.value.validator);

    const clearEdit = () => {
      formDataEdit.id   =  null 
      formDataEdit.title   =  null 
      formDataEdit.firstName  =  null 
      formDataEdit.lastName   =  null 
      formDataEdit.gender    =  null 
      formDataEdit.position  =  null 
      formDataEdit.telephone =  null 
      formDataEdit.email    =  null 
      formDataEdit.serviceCenterID  =  null 
    setTimeout(() => {
        validatorEdit.value.clearErrors();
    }, 100);
    };

  async function submitEdit() {
  if(prop.readOnly) return;
  if (!(await confirmDialog())) return;
  validatorEdit.value.clearErrors();
  await validatorEdit.value.validate();
  if (validatorEdit.value.fail()) {

    toast.error({
      message: validatorEdit.value.getErrorMessage(),        
    });
    
    isErrorEdit.value = true;
    setTimeout(() => {
      isErrorEdit.value = false;
    }, 1000);
    return true;
  }

  const { error } = await useFetch('/api/center/staff/upsert', {
    method: "POST",
    body: JSON.stringify({
      id : formDataEdit.id,
      title : formDataEdit.title,
      firstName : formDataEdit.firstName,
      lastName : formDataEdit.lastName,
      gender : formDataEdit.gender,
      position : formDataEdit.position,
      telephone : formDataEdit.telephone,
      email : formDataEdit.email,
      serviceCenterID : formDataEdit.serviceCenterID,
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
    clearEdit();
  }
  //@ts-ignore
  openisTrues?.value?.closeOffCanvas(); 
  emit('canvasIsOpen', true)

}
  
  onMounted(()=>{
    if(prop.openisTrue){
      // console.log(prop.openisTrue)
      openisTrues?.value?.openOffCanvas();
    }
  })

  const { data }  =  await useFetch<{data : ServiceCenter[]}>('/api/center/get',{
  method : 'POST'
  })  

  let serviceCenterList : any = [] 

  data.value?.data.forEach(ele =>{
    serviceCenterList.push({
        label : ele.nameKH,
        value : ele.id
      })
    })    

    if(prop.id){
      const { data } = await useFetch<Staff>('/api/center/staff/get', { method : 'POST' , body : JSON.stringify({ id : prop.id})})
      formDataEdit.id = data.value?.id
      formDataEdit.title = data.value?.title
      formDataEdit.firstName = data.value?.firstName
      formDataEdit.lastName = data.value?.lastName
      formDataEdit.gender = data.value?.gender
      formDataEdit.position = data.value?.position
      formDataEdit.telephone = data.value?.telephone
      formDataEdit.email = data.value?.email
      formDataEdit.serviceCenterID = data.value?.serviceCenterID
    }

   
</script>

<template>     
      <TwOffcanvas position="right" width="800px" ref="openisTrues">
      <template #headerTitle>
        <span class="font-[Moul] text-primary"> បញ្ចូលបុគ្គលិកមណ្ឌល </span></template
      >     
      <div class="p-4 overflow-auto font-[battambang]">
        <div>
          <TwForm
            :name="formNameEdit"
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
            :class="{
              'tw-shake': isErrorEdit,
            }"
            :rules="formRulesEdit"
            @submit="submitEdit()"
            :custom-field-name="{
              roleName: 'ឈ្មោះតួនាទី',
              roleDescription: 'ពិពណ៌នាតួនាទី',
            }"
          >          
          <div class="col-span-4" >
            <TwSelect                           
              label="គោរមងារនាម"
              name="title"            
              v-model="formDataEdit.title"            
              required                    
              :items="temTitle"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="title" />            
          </div>  
          <div class="col-span-4 " >
            <TwSelect                           
              label="ភេទ"
              name="gender"            
              v-model="formDataEdit.gender"            
              required                    
              :items="[{value : 'ប្រុស', label: 'ប្រុស' } , { value : 'ស្រី' , label : 'ស្រី'}, { value : 'ភ្សេងៗ' , label : 'ភ្សេងៗ'}]"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="gender" />            
          </div>  
          <div class="col-span-4 " >
            <TwSelect                           
              label="បុគ្គលិករបស់មណ្ឌល"
              name="serviceCenterID"            
              v-model="formDataEdit.serviceCenterID"            
              required                    
              :items="serviceCenterList"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="serviceCenterID" />            
          </div>  
          <div class="col-span-12">
              <TwInput
                label="ឈ្មោះ"
                name="firstName"
                v-model="formDataEdit.firstName"
                placeholder="បញ្ចូលឈ្មោះ"
                type="text"
              />
              <CustomErrorMessage name="firstName" />
            </div>
            <div class="col-span-12">
              <TwInput
                label="នាមត្រកូល"
                name="lastName"
                v-model="formDataEdit.lastName"
                placeholder="បញ្ចូលនាមត្រកូល"
                type="text"
              />
              <CustomErrorMessage name="lastName" />
            </div>  
            <div class="col-span-12">
              <TwInput
                label="តួនាទី"
                name="position"
                v-model="formDataEdit.position"
                placeholder="បញ្ចូលតួនាទី"
                type="text"
              />
              <CustomErrorMessage name="position" />
            </div>    
            <div class="col-span-12">
              <TwInput
                label="លេខទូរស័ព្ទ"
                name="telephone"
                v-model="formDataEdit.telephone"
                placeholder="បញ្ចូលលេខទូរស័ព្ទ"
                type="text"
              />
              <CustomErrorMessage name="telephone" />
            </div>                
            <div class="col-span-12">
              <TwInput
                label="អុីមែល"
                name="email"
                v-model="formDataEdit.email"
                placeholder="បញ្ចូលអុីមែល"
                type="text"
              />
              <CustomErrorMessage name="email" />
            </div>     

            <div class="col-span-12 flex justify-end gap-1">
              <UButton
                :ripple="true"
                color="gray"
                square
                type="button"
                size="lg"
                class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
                @click="clearEdit()"
              >
                កំណត់ឡើងវិញ
              </UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
            </div>
          </TwForm>
        </div>
      </div>
    </TwOffcanvas>   
      <TwToast     
      :toasts="useToat"
      :class="'font-[battambang]'"
      :position="'bottom-left'"   
      />
  
</template>