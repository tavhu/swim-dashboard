<script setup lang="ts">
import { TwOffcanvas } from "vue3-tailwind";
import { type contactMessage } from "@prisma/client";
import { useTimeAgo } from '@vueuse/core'

const prop = defineProps<{
  openisTrue: boolean;
  id: string | undefined | null;
}>();

const messNOtificationNumber = useState<number>('readMessages')

// const emit = defineEmits<{
//   (event: "canvasIsOpen", isOpen: boolean): any;
// }>();

const { data } = await useFetch<contactMessage>("/api/contact/get", {
  method: "POST",
  body: JSON.stringify({
    id: prop.id,
  }),
});

if (data?.value?.read === false) {
  console.log(data.value?.read)
  await useFetch('/api/contact/update', {method : 'post', body : 
  JSON.stringify({
    id: prop.id
  })
  })
  messNOtificationNumber.value = messNOtificationNumber.value + 1
} 
  

const openisTrues: any = ref();
onMounted(() => {
  if (prop.openisTrue) {
    // console.log(prop.openisTrue)
    openisTrues?.value?.openOffCanvas();
  }
});

// onBeforeDestroy(()=>{
//   emit('canvasIsOpen',false)
// })
</script>
<template>
  <TwOffcanvas position="right" width="800px" ref="openisTrues">
    <template #headerTitle>
      <span class="font-[Moul] text-primary">{{ tr('ព័ត៌មានលម្អិត') }}</span></template>
    <div class="p-4 overflow-auto font-[battambang]">
      <div>
        <p class="mb-2">
          <span class="text-primary">{{ tr('កាលបរិច្ឆេទ') }}</span><br>
          <span> {{  timeagoInKhmer(useTimeAgo(data?.createdAt ?? '' ).value) }} </span>
        </p>
        <hr />
        <div class="mt-2 flex justify-evenly ">
          <div>
            <span class="text-primary"> ឈ្មោះមនត្រ្ </span><br>
            <span> {{ data?.name}} </span>
          </div>
          <div>
            <span class="text-primary">{{ tr('អុីមែល') }}</span><br>
            <span> {{ data?.email}} </span>
          </div>
          <div>
            <span class="text-primary">{{ tr('លេខទូរស័ព្ទ') }}</span><br>
            <span> {{ data?.phone}} </span>
          </div>
        </div>
        <hr class="mt-2" />
        <div  class="mt-2" v-if="data?.serviceCenterName">
          <span class="text-primary">{{ tr('ឈ្មោះមណ្ឌល') }}</span><br>
          <span> {{ data?.serviceCenterName}} </span>
        </div>
        <div  class="mt-2" v-if="data?.username">
          <span class="text-primary"> ឈ្មោះចូលប្រើប្រាស់ក្នុងប្រើប្រាស់ </span><br>
          <span> {{ data?.username}} </span>
        </div>
        <div class="mt-2">
          <span class="text-primary">{{ tr('មូលហេតុ') }}</span><br>
          <span> {{ data?.reason}} </span>
        </div>
        <div  class="mt-2" v-if="data?.details">
          <span class="text-primary">{{ tr('ការពិពណ៌នា') }}</span><br>
          <span> {{ data?.details}} </span>
        </div>
        
      </div>
    </div>
  </TwOffcanvas>
</template>
