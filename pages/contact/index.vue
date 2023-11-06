<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

type Schema = z.output<typeof schema>

definePageMeta({
  layout: "front",
  auth: {
     unauthenticatedOnly : false,     
  }
});

const option = ['ផ្សេងៗ', 'បញ្ហានៅពេលចូលក្នុងប្រព័ន្ទ','ស្នើសុំបង្កើតមជ្ឈមណ្ឌល']

useHead({
  title: "ទាក់ទង​មក​ពួក​យើង",
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




async function onSubmit (event: FormSubmitEvent<any>) {

  
  // const res = 
  // Do something with data
  console.log(event.data)
}

</script>

<template>
  <UContainer class="flex justify-center  items-center h-screen font-[battambang]"> 
      <UCard class="w-96 lg:w-96">
        <template #header>          
          <div class=" text-gray-700 dark:text-white font-[moul]">
            ទំនាក់ទំនងមកពួកយើង
          </div>
        </template>      
          <UForm  :schema="schema" :state="state" @submit="onSubmit" class="flex flex-col  gap-5">
            <UFormGroup label="ឈ្មោះពេញ" name="name">
              <UInput v-model="state.name" size="xl"/>
            </UFormGroup>
            <UFormGroup label="អុីមែល" name="email">
              <UInput v-model="state.email" size="xl"/>
            </UFormGroup>
            <UFormGroup label="លេខទូរស័ព្ទ" name="phone">
              <UInput type="text" v-model="state.phone" size="xl"/>
            </UFormGroup>
             
            <UFormGroup label="ការពិពណ៌នា" name="reason">
              <USelect v-model="state.reason" :options="option" size="xl"/>
            </UFormGroup>    

            <UFormGroup label="ឈ្មោះចូលប្រើប្រាស់ក្នុងប្រើប្រាស់" v-if="state.reason === option[1] " name="username">
              <UInput  required oninvalid="this.setCustomValidity('សូមបំពេញទិន្នន័យ')"
               v-model="state.username" size="xl"/>
            </UFormGroup> 
            <UFormGroup label="ឈ្មោះមណ្ឌល" v-if="state.reason === option[2] " name="serviceCenterName">
              <UInput  required oninvalid="this.setCustomValidity('សូមបំពេញទិន្នន័យ')" v-model="state.serviceCenterName" size="xl"/>
            </UFormGroup> 
            <UFormGroup label="ការពិពណ៌នា" name="details">
              <UTextarea v-model="state.details" size="xl"/>
            </UFormGroup>    
            <UFormGroup>
              <UButton type="submit" size="lg">
                បញ្ចូន
              </UButton>
            </UFormGroup>
        </UForm>      

        <!-- <template #footer>
          <Placeholder class="h-8" />
        </template> -->
      </UCard>  
  </UContainer>
</template>
