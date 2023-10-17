<script setup lang="ts">
import {
  TwButton, 
  useToast,
  DatatableColumn,
  DatatableData,
  TwDatatableServer,  
} from "vue3-tailwind";

const toast = useToast();

useHead({
  title: "បញ្ចីគណនី",
});

const data = ref({
  column: [
  {
      label: "ល.រ",
      field: "number",
      width: "50px",
      sortable: false,
    },
    {
      label: "ឈ្មោះពេញ",
      field: "category",
      width: "350px",
      sortable: false,
    },
    {
      label: "ឈ្មោះគណនី",
      field: "username",
      width: "200px",
      sortable: false,
    },
    {
      label: "សកម្មភាព",
      field: "action",
      width: "1200px",
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
  if (!(await confirmDialog())) return;

  const { error } = await useFetch("/api/role/delete", {
    method: "POST",
    body: JSON.stringify({
      id: id,
    }),
  })

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
  data.value.limit === 10 ? (data.value.limit = 5) : (data.value.limit = 10);
};

const PopUPPermission = ref();
const refClickRoleID = ref("");
const AddPermission = (clickPermissionID: string) => {
  PopUPPermission.value.openOffCanvas();
  refClickRoleID.value = clickPermissionID;
}
</script>

<template>
  <div class="font-[Battambang]">   
    <div class="mt-5">
        <div class="flex justify-between">
            <h2 class="text-2xl font-[Moul]">បញ្ចីតួនាទី</h2>
            <h2 class="text-xl font-[Moul]">
                <NuxtLink :to="config.public.origin + '/register'">
                    <TwButton variant="success">
                        បង្កើតតួនាទី
                    </TwButton>
                </NuxtLink>        
            </h2>
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
        <template #row="{ column, data, index }">
          <template v-if="column.field === 'number'">
             {{ index }}
          </template>
          <template v-if="column.field === 'category'">
            {{ data.lastname }} {{ data.firstname }} 
          </template>
          <template v-if="column.field === 'description'">
            {{ data.username }}
          </template>
          <template v-if="column.field === 'action'">
            <div class="flex gap-2 justify-center">
              <TwButton
                :ripple="true"
                variant="success"
                @click="AddPermission(data.id)"
                class="border"
              >
                ការអនុញ្ញាត
              </TwButton>
              <NuxtLink   
                :disabled="true"       
                :to="config.public.origin + '/register?id='  + data.id"
              >               
                <TwButton variant="primary" :disabled="true" class="border">
                      កែសម្រួល
                </TwButton>
              </NuxtLink>
              <TwButton variant="danger" @click="deleteRecord(data.id)">
                លុបចេញ
              </TwButton>
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
