<script setup lang="ts">
import {
  useForm,
  useToast,
  TwInput,
  TwForm,
  TwTextarea,
  type DatatableColumn,
  type DatatableData,
  TwDatatableServer,
  TwOffcanvas,
} from "vue3-tailwind";

// import { useResource } from '~~/store/resource'
const readOnly = checkIfPageReadOnly()
// const resource = useResource()

useHead({
  title: "បុគ្គលិកមណ្ឌល",
});

const toast = useToast()

const data = ref({
  column: [
    {
      label: "ឈ្មោះ",
      field: "name",
      width: "400px",
      sortable: false,
    },
    {
      label: "មណ្ឌល",
      field: "description",
      width: "800px",
      sortable: false,
    },
    {
      label: "សកម្មភាព",
      field: "action",
      width: "400px",
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

const fetchData = async () => {

  const {data: response} = await useFetch <{
    total: number;
    data: DatatableData[];
}> (
  '/api/center/staff/get' ,      
      {
        body : JSON.stringify(({
        limit: data.value.limit.toString(),
        skip: data.value.offset.toString(),
        q: data.value.search.toString(),
        sortType: data.value.sortType,
        sortBy: data.value.sortBy,
      })) ,
        method : 'post'
      }
  );
  // console.log(response.value?.data)
  globalData.value = {
    data: response.value?.data  ? response.value?.data : [],
    totalData: response.value?.total ? response.value?.total : 0,
  };
  return {
    data: response.value?.data  ? response.value?.data : [],
    totalData: response.value?.total ? response.value?.total : 0,
  };
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
  if(readOnly) return;
  if (!(await confirmDialog())) return;

  const { error } = await useFetch("/api/center/staff/delete", {
    method: "POST",
    body: JSON.stringify({
      id: id,
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
  //update change limit ref in order to refetch data
  updateTable() 
};

const openisTrue = ref(false);
const openisKey = ref(0)
const editID = ref("");
const editRecord = async (id: string) => {
  if(readOnly) return;
  // console.log(id)
  openisTrue.value = true
  openisKey.value ++ 
  editID.value = id;  
}

const openRegisterForm = ()=>{
  openisTrue.value = true
  openisKey.value ++ 
  editID.value = '';  
}

const updateTable = ()=>{
      data.value.limit === 10 ? (data.value.limit = 5) : (data.value.limit = 10);
    }
</script>

<template>
  <div class="font-[Battambang]">    
    <div class="mt-5">      
      <div class="flex justify-between">
            <h2 class="text-2xl font-[Moul] text-primary">បញ្ចីបុគ្គលិកមណ្ឌល</h2>         
               
            <UButton @click="openRegisterForm" color="primary"  size="xl" :disabled="readOnly">
              <h2 class="text-xl font-[Moul]">ចុះឈ្មោះបុគ្គលិកមណ្ឌល </h2>
            </UButton>
                                
        </div>
      <hr class="my-2 border dark:border-gray-700" />
      <TwDatatableServer
        v-bind:fetch-data="fetchData"
        v-model:search="data.search"
        v-model:limit="data.limit"
        v-model:offset="data.offset"
        v-model:sort-by="data.sortBy"
        v-model:sort-type="data.sortType"
        :column="data.column"
        :setting="data.setting"
        @on-sort-change="sortClick"
      >
        <template  #row="{ column, data }">
          <template v-if="column.field === 'name'">
            {{ data.title }}   {{  data.lastName }} {{  data.firstName }} ភេទ {{ data.gender}}
          </template>
          <template v-if="column.field === 'description'" >
            {{ data.ServiceCenter.nameKH }}
          </template>
          <template v-if="column.field === 'action'">
            <div class="flex gap-2 justify-center">
             
              <UButton 
              :disabled ="readOnly"
              icon="i-heroicons-pencil-square"
              size="sm"
              color="primary"
              square
              variant="solid"                
              @click="editRecord(data.id)"
              >
                កែសម្រួល
              </UButton >            

              <UButton 
              :disabled ="readOnly"
              icon="i-heroicons-trash"
              size="sm"
              color="red"
              square
              variant="solid"  
               @click="deleteRecord(data.id)">
                លុបចេញ
              </UButton >
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
    <CenterStaffCanvasForm @canvasIsOpen="updateTable"  :readOnly="readOnly" :id="editID" :openisTrue="openisTrue"  :serviceCenterID="null" :key="openisKey"/>
   
  </div>
</template>
