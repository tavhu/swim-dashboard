<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

const reCaptcharKey = useRuntimeConfig().public.reCaptcha_Client_Key
const toast = useToast()
const { t } = useI18n();
type Schema = z.output<typeof schema>
definePageMeta({
  layout: "front",
  auth: {
     unauthenticatedOnly : true,     
  }
});
const tokenKey = ref('')

const option = ['ផ្សេងៗ', 'បញ្ហានៅពេលចូលក្នុងប្រព័ន្ទ','ស្នើសុំបង្កើតមជ្ឈមណ្ឌល']
useHead({
  title: tr("ទាក់ទង​មក​ពួក​យើង"),
  script : [ { 'src' : `https://www.google.com/recaptcha/api.js?render=${reCaptcharKey}`}]
});
const state = reactive({
  email: undefined,
  name: undefined,
  phone : undefined,
  details : undefined,
  reason : undefined,
  serviceCenterName : undefined,
  username : undefined
})

const schema = z.object({
  email: z.string({ required_error : 'សូមបំពេញទិន្នន័យ' }).email('អុីមែលមិនត្រឹមត្រូវ'),
  name: z.string({ required_error : 'សូមបំពេញទិន្នន័យ'}),
  phone : z.string({ required_error : 'សូមបំពេញទិន្នន័យ'}).refine((val) => /^\d+$/.test(val) , {
    message: "លេខទូរស័ព្ទមិនត្រឹមត្រូវ"
  }),  
  reason :  z.string({ required_error : 'សូមបំពេញទិន្នន័យ'}),
  // username :z.optional(z.string()).refine((va) => state.reason == option[1] ? z.string({ required_error : 'សូមបំពេញទិន្នន័យ'}) : z.optional(z.string()) ),
  // serviceCenterName : state.reason == option[2] ? z.string({ required_error : 'សូមបំពេញទិន្នន័យ'}) : z.optional(z.string()) ,    
})

const loading = ref(false)
const messageSent = ref(false)

const ClearMesage = ()=>{
  state.email = undefined
  state.name = undefined
  state.phone = undefined
  state.details = undefined
  state.reason = undefined
  state.serviceCenterName = undefined
  state.username = undefined
  messageSent.value = false 
}


const  onSubmit = async (event: FormSubmitEvent<any>) => {  
 
  if(messageSent.value){
    ClearMesage()
    return true
  }
  if (!(await confirmDialog())){ return true }  
  //@ts-ignored
  window.grecaptcha.ready(async () => {
    //@ts-ignore
           window.grecaptcha.execute(reCaptcharKey, {action: 'submit'}).then(async (token : string) => {
                // Add your logic to submit to your backend server here.
                // console.log((token))
                tokenKey.value = token
                loading.value = true
                messageSent.value = false
                const { data }  = await useFetch('/api/contact', { method: 'post' ,    
                  body : JSON.stringify({
                    email : state.email,
                    token : tokenKey.value,
                    name : state.name,
                    phone : state.phone,
                    details : state.details,
                    reason : state.reason,
                    serviceCenterName : state.serviceCenterName,
                    username : state.username,
                  })
              })
                // const res = 
                // Do something with data
                // console.log(data)
                if(data.value){
                  toast.add({ title : t('message.saved'),
                  icon : 'i-heroicons-envelope',    
                })
                 
                }else{
                  toast.add({ title : 'បរាជ័យ! សូម​ព្យាយាម​ម្តង​ទៀត​នៅ​ពេល​ក្រោយ',
                  icon : 'i-heroicons-envelope',    
                  color : 'red'                  
                })
                }
                messageSent.value = true
                loading.value = false
            });
          }); 
}

</script>

<template>
  <div>
      <UContainer class="flex flex-col justify-center items-center h-screen font-[battambang] gap-2"> 
        <div class="flex w-full  md:w-9/12 lg:w-9/12 justify-start items-start">
          <NuxtLink to="/login">
            <Icon name="material-symbols:keyboard-backspace-rounded" size="35" class/>
          </NuxtLink>
        </div>
        <UCard class="w-full  md:w-9/12 lg:w-9/12">
          <template #header>          
            <div class=" text-gray-700 dark:text-white font-[moul]">{{ tr('ទំនាក់ទំនងមកពួកយើង') }}</div>
          </template>      
            <UForm  :schema="schema" :state="state" @submit="onSubmit" class="flex flex-col  gap-5">
              <UFormGroup :label="tr('ឈ្មោះពេញ')" name="name"   v-if="!messageSent">
                <UInput v-model="state.name" size="xl"/>
              </UFormGroup>
              <UFormGroup :label="tr('អុីមែល')" name="email" v-if="!messageSent">
                <UInput v-model="state.email" size="xl"  />
              </UFormGroup>
              <UFormGroup :label="tr('លេខទូរស័ព្ទ')" name="phone"  v-if="!messageSent">
                <UInput type="text" v-model="state.phone" size="xl"/>
              </UFormGroup>
              <UFormGroup :label="tr('ការពិពណ៌នា')" name="reason"  v-if="!messageSent">
                <USelect v-model="state.reason" :options="option" size="xl"/>
              </UFormGroup>    
              <UFormGroup label="ឈ្មោះចូលប្រើប្រាស់ក្នុងប្រើប្រាស់"   v-if="state.reason === option[1] &&  !messageSent" name="username">
                <UInput  required oninvalid="this.setCustomValidity('សូមបំពេញទិន្នន័យ')"
                v-model="state.username" size="xl"/>
              </UFormGroup> 
              <UFormGroup :label="tr('ឈ្មោះមណ្ឌល')"   v-if="state.reason === option[2] &&  !messageSent" name="serviceCenterName">
                <UInput  required oninvalid="this.setCustomValidity('សូមបំពេញទិន្នន័យ')" v-model="state.serviceCenterName" size="xl"/>
              </UFormGroup> 
              <UFormGroup :label="tr('ការពិពណ៌នា')" v-if="!messageSent" name="details">
                <UTextarea v-model="state.details" size="xl"/>
              </UFormGroup>    
              
              <UFormGroup>
                <div class="flex justify-center" v-if="messageSent">
                  <!-- <UIcon name="i-heroicons-envelope" class="text-red-600 text-6xl" /> -->
                  <Icon name="material-symbols:mark-email-read-rounded" color="green" size="80" />
                </div>
              <UButton type="submit" size="lg" :loading="loading" :icon=" messageSent ?  'i-heroicons-pencil-square' : 'i-heroicons-envelope' " >               
                  
                  {{  messageSent ? 'ផ្ញើសារថ្មី' : 'បញ្ចូន'
                    }}
                </UButton>
              </UFormGroup>
          </UForm>          
        </UCard>  
    </UContainer>
    <UNotifications class="font-[battambang]"/>
  </div>
</template>
