<script setup lang="ts">
import {
  useToast,
  type DatatableColumn,
  type DatatableData,
  type DropdownItem,
  TwDatatableServer,
} from "vue3-tailwind";
import { useTimeAgo } from '@vueuse/core'

const messNOtificationNumber = useState<number>('readMessages', () => 0)


const readOnly = checkIfPageReadOnly()
const { data: userDataAuth } = useAuth()
const toast = useToast();
useHead({
  title: "បញ្ចីប្រអប់សារ",
});

const data = ref({
  column: [
    // {
    //     label: "ល.រ",
    //     field: "number",
    //     width: "50px",
    //     sortable: false,
    //   },
    {
      label: "កាលបរិច្ឆេទ",
      field: "dateTime",
      width: "100px",
      sortable: false,
    },
    {
      label: "ឈ្មោះពេញ",
      field: "category",
      width: "450px",
      sortable: false,
    },
    {
      label: "អុីមែល",
      field: "email",
      width: "300px",
      sortable: false,
    },
    {
      label: "គោលបំណង",
      field: "reason",
      width: "350px",
      sortable: false,
    },
    {
      label: "សកម្មភាព",
      field: "action",
      width: "650px",
      sortable: false,
    },
  ] as Array<DatatableColumn>,
  data: [] as Array<DatatableData>,
  limit: 5,
  offset: 0,
  search: "",
  sortBy: "id",
  sortType: "desc",
  setting: {
    checkbox: true,
    limitOption: [
      {
        label: "5",
        value: 5,
      },
      {
        label: "10",
        value: 10,
      },
      {
        label: "50",
        value: 50,
      },
      {
        label: "100",
        value: 100,
      },
      {
        label: "200",
        value: 200,
      },
    ],
  },
});

const globalData: any = ref();
const config = useRuntimeConfig()
// const datareturn :any = ref()
const fetchData = async () => {

  const { data: response } = await useFetch<{
    total: number;
    data: DatatableData[];
  }>('/api/contact/get', {
    method: 'post', body: JSON.stringify({
      limit: data.value.limit.toString(),
      skip: data.value.offset.toString(),
      q: data.value.search.toString(),
      sortType: data.value.sortType,
      sortBy: data.value.sortBy,
    }),
  },
  
  )

  globalData.value = {
    totalData: response.value?.total, // response["total"],
    data: response.value?.data, // response["data"],   
  };
  return {
    totalData: response?.value?.total ? response?.value?.total : 0, // response["total"],
    data: response?.value?.data ? response?.value?.data : [], // response["data"],  
  }
}

fetchData()

const sortClick = (event: any) => {
  const sortBy = data.value.sortBy;
  const sortType = data.value.sortType;
  const sortByNew = event;
  const sortTypeNew =
    event === sortBy ? (sortType === "asc" ? "desc" : "asc") : "asc";
  data.value = { ...data.value, sortBy: sortByNew, sortType: sortTypeNew };
};

const deleteRecord = async (id: string) => {
  if (readOnly) return;
  if (!(await confirmDialog())) return;

  const { error } = await useFetch('/api/contact/delete', {
    method: "POST",
    body: JSON.stringify({
      id: id,
    }),
  })

  if (error.value?.statusCode) {
    toast.error({
      message: "មិនជោគជ័យ",
    });
  } else {
    toast.success({
      message: "ជោគជ័យ",
    });
  }
  //update change limit ref in order to refetch data
  data.value.limit === 10 ? (data.value.limit = 5) : (data.value.limit = 10);
};


const { data: roleData } = await useFetch("/api/role/get", {
  method: 'get', query: {
    //@ts-ignore
    userID: userDataAuth.value?.sub
  }
})
const roleDataFormat: DropdownItem[] = new Array({ label: '', value: '' })
roleDataFormat.pop()
//@ts-ignored
roleData.value?.data?.forEach((ele: any) => {
  roleDataFormat.push(
    {
      label: ele?.name,
      value: ele?.id
    }
  )
});

const selectedID = ref("")
const keyIncrement = ref(0)
const openCanvasBoolean = ref(false)
const OpenCanvas = (id: string) => {
  selectedID.value = id
  openCanvasBoolean.value = true
  keyIncrement.value++
}
const Boo = ref(false)

onMounted(()=>{
  watch(messNOtificationNumber, () => {
    if (messNOtificationNumber.value != 0) {
      console.log('canvasClosed')
      data.value.limit === 10 ? (data.value.limit = 5) : (data.value.limit = 10);
    }
  })
})

</script>
<template>
  <div class="font-[Battambang]"> 
    <div class="mt-5">
      <div class="flex justify-between">
        <h2 class="text-sm lg:text-xl font-[Moul] text-primary">បញ្ចីប្រអប់សារ</h2>
      </div>
      <hr class="my-2 border dark:border-gray-700" />
      <TwDatatableServer v-bind:fetch-data="fetchData" v-model:search="data.search" v-model:limit="data.limit"
        v-model:offset="data.offset" v-model:sort-by="data.sortBy" v-model:sort-type="data.sortType" :column="data.column"
        @on-sort-change="sortClick">
        <template #row="{ index, column, data }" :class="'bg-red-400'"  >
          <!-- <template v-if="column.field === 'number'">
            <div class="flex justify-center">       
                  {{ index }}           
            </div> 
          </template> -->
          <template v-if="column.field === 'dateTime'">
            <div class="flex justify-center">
              {{ timeagoInKhmer(useTimeAgo(data.createdAt).value) }}
            </div>
          </template>
          <template v-if="column.field === 'category'">
            <div class="flex justify-center">
              {{ data?.name }}
            </div>
          </template>
          <template v-if="column.field === 'email'">
            <div class="flex justify-center">
              {{ data.email }}
            </div>
          </template>
          <template v-if="column.field === 'reason'">
            {{ data.reason }}
          </template>
          <template v-if="column.field === 'action'">
            <div class="flex gap-2 justify-center">

              <UButton  icon="i-heroicons-eye" class="border" :class="!data.read ? ' bg-primary ' : 'bg-gray-500 '" @click="OpenCanvas(data.id)"
                :disabled="readOnly">
                មើលព័ត៌មានលំអិត
              </UButton>
              <UButton color="red" icon="i-heroicons-trash" @click="deleteRecord(data.id)" :disabled="readOnly">
                លុបចេញ
              </UButton>
            </div>
          </template>
        </template>
        <template #empty>
          <div class="bg-white dark:bg-gray-800 text-center w-full">
            គ្មាន​ទិន្នន័យ
          </div>
        </template>
      </TwDatatableServer>
    </div>
    <ContactMessageContactDetailsCanvas :openisTrue="openCanvasBoolean"  :id="selectedID" :key="keyIncrement" />
  </div>
</template>
