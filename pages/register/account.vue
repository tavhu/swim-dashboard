<script setup lang="ts">
import {   
  useToast,
  type DatatableColumn,
  type DatatableData,
  type DropdownItem,
  TwDatatableServer,  
} from "vue3-tailwind";

const readOnly = checkIfPageReadOnly()
const { data  : userDataAuth } = useAuth()
const toast = useToast();
useHead({
  title: "បញ្ចីគណនី",
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
      label: "រូបថត",
      field: "Profile",
      width: "150px",
      sortable: false,
    },
    {
      label: "ឈ្មោះពេញ",
      field: "category",
      width: "450px",
      sortable: false,
    },
    {
      label: "ឈ្មោះគណនី",
      field: "username",
      width: "300px",
      sortable: false,
    },
     {
      label: "សិទ្ធិប្រើប្រាស់",
      field: "permission",
      width: "150px",
      sortable: false,
    },
     {
      label: "ស្ថានភាពគណនី",
      field: "status",
      width: "150px",
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

const fetchData = async () => {
  const baseUrl = "/api/user/get";
  const response = await fetch(
    baseUrl +
      "?" +
      new URLSearchParams({
        limit: data.value.limit.toString(),
        skip: data.value.offset.toString(),
        q: data.value.search.toString(),
        sortType: data.value.sortType,
        sortBy: data.value.sortBy,
      })
  )

  const responseJson = await response.json();
  // console.log(responseJson)
  globalData.value = {
    data: responseJson["data"],
    totalData: responseJson["total"],
  };
  return {
    data: responseJson["data"],
    totalData: responseJson["total"],
  }
}

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

  const { error } = await useFetch("/api/user/delete", {
    method: "POST",
    body: JSON.stringify({
      id: id,
    }),
  })

  if (error.value?.statusCode){
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

const notGrated = ref(false)

const {data : roleData  } = await useFetch("/api/role/get",{ method : 'get' , query : {
  //@ts-ignore
  userID : userDataAuth.value?.sub }
})
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
</script>
<template>
  <div class="font-[Battambang]">   
    <div class="mt-5">
        <div class="flex justify-between">
            <h2 class="text-2xl font-[Moul] text-primary">បញ្ចីតួនាទី</h2>         
                <NuxtLink :to="config.public.origin + '/register'" :disabled="readOnly" >
                    <UButton  color="primary"  size="xl" :disabled="readOnly">
                      <h2 class="text-xl font-[Moul]"> បង្កើតតួនាទី </h2>
                    </UButton>
                </NuxtLink>                   
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
        @on-sort-change="sortClick"
      >
        <template #row="{ index, column, data }">
          <!-- <template v-if="column.field === 'number'">
            <div class="flex justify-center">       
                  {{ index }}           
            </div> 
          </template> -->
          <template v-if="column.field === 'Profile'">
            <div class="flex justify-center">
              <img :src="config.public.origin + '/' + data.image" alt="" class="w-12 h-12 rounded-full border border-[#1d152a7a]">
            </div>
          </template>
          <template v-if="column.field === 'category'">
            <div class="flex justify-center">
              {{ data.lastname }} {{ data.firstname }}
            </div>
          </template>
          <template v-if="column.field === 'username'">
            <div class="flex justify-center">
              {{ data.username }}
            </div>
          </template>
          <template v-if="column.field === 'status'">
            <div class="flex justify-center">
              <span v-if="data.status" class="text-blue-700 dark:text-white">  ដំណើការ </span>
              <span v-else class="text-red-700"> បិទដំណើការ </span>
            </div>
          </template>
          <template v-if="column.field === 'permission'">
            <div class="flex justify-center">
              {{ data.Role.name }} 
            </div>         
          </template>
          <template v-if="column.field === 'action'">
            <div class="flex gap-2 justify-center">
              <NuxtLink                     
                :to="config.public.origin + '/register?id='  + data.id"  :disabled="readOnly"               >               
                <UButton color="primary"  icon="i-heroicons-pencil-square" class="border"  :disabled="readOnly">
                      កែសម្រួល
                </UButton>
              </NuxtLink>
              <UButton color="red" icon="i-heroicons-trash" @click="deleteRecord(data.id)"  :disabled="readOnly || !(roleDataFormat?.find(ii => ii.value == data.Role.id)?.value ? true : false ) ">
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
  </div>
</template>
