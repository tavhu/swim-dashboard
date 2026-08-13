<script setup lang="ts">
import {
    TwDropdownMenu,
    useToast,
    type DatatableColumn,
    type DatatableData,
    type DropdownItem,
    TwDatatableServer,
} from "vue3-tailwind";

const readOnly = checkIfPageReadOnly()
const { data: userDataAuth } = useAuth()
const toast = useToast();
useHead({
    title: "បញ្ចីអតិថិជន",
});


const data = ref({
    column: [
        {
            label: "លេខសំគាល់",
            field: "readableCode",
            width: "140px",
            sortable: false,
        },
        {
            label: "រូបថត",
            field: "logo",
            width: "110px",
            sortable: false,
        },
        {
            label: "ឈ្មោះជាភាសារខ្មែរ",
            field: "nameKH",
            width: "400px",
            sortable: false,
        },
        {
            label: "ស្ថានភាព",
            field: "status",
            width: "140px",
            sortable: false,
        },
        {
            label: "សកម្មភាព",
            field: "action",
            width: "260px",
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

    const response = await $fetch<{
        total: number;
        data: DatatableData[];
    }>(
        '/api/client/personalInformationGet'
        ,
        {
            body: {
                limit: data.value.limit.toString(),
                skip: data.value.offset.toString(),
                q: data.value.search.toString(),
                sortType: data.value.sortType,
                sortBy: data.value.sortBy,
            }
            ,
            method: 'post'
        },
    )

    globalData.value = {
        totalData: response?.total, // response["total"],
        data: response?.data, // response["data"],   
    };
    return {
        totalData: response?.total ? response?.total : 0, // response["total"],
        data: response?.data ? response?.data : [], // response["data"],  
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

    // Was "/api/center/delete", which calls prisma.serviceCenter.delete() — it
    // looked a client id up in the service-centre table and always failed.
    const { error } = await useFetch("/api/client/delete", {
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
// The six national forms from the SWIMS manual (ទម្រង់ទី១-៦), matching the
// ApprovalRecordType enum. The action column previously offered eight from an
// older set — needs assessment, family tracing, family assessment, referral —
// and all but the first linked to service-centre pages with a client id.
const CASE_FORMS = [
    { label: 'ទម្រង់(១)', title: 'បញ្ជីអតិថិជន' },
    { label: 'ទម្រង់(២)', title: 'ការប្រើសេវាកម្មរបស់អតិថិជន' },
    { label: 'ទម្រង់(៣)', title: 'ផែនការករណីរបស់អតិថិជន' },
    { label: 'ទម្រង់(៤)', title: 'សមាហរណកម្ម' },
    { label: 'ទម្រង់(៥)', title: 'តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន' },
    { label: 'ទម្រង់(៦)', title: 'បិទករណី' },
]

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

const openisTrue = ref(false)
const openisKey = ref(0)
const editID = ref(null)
const serviceCenterID = ref('')

const addStaff = (CenterID: string) => {
    serviceCenterID.value = CenterID
    openisTrue.value = true
    openisKey.value++

}
</script>
<template>
    <div class="font-[Battambang]">
        <div class="mt-5">
            <div class="flex justify-between">
                <h2 class="text-2xl font-[Moul] text-primary">បញ្ចីអតិថិជន</h2>
                <NuxtLink :to="config.public.origin + '/client/register'" :disabled="readOnly">
                    <UButton color="primary" size="xl" :disabled="readOnly">
                        <h2 class="text-xl font-[Moul]"> ចុះឈ្មោះអតិថិជន </h2>
                    </UButton>
                </NuxtLink>
            </div>
            <hr class="my-2 border dark:border-gray-700" />
            <TwDatatableServer v-bind:fetch-data="fetchData" v-model:search="data.search" v-model:limit="data.limit"
                v-model:offset="data.offset" v-model:sort-by="data.sortBy" v-model:sort-type="data.sortType"
                :column="data.column" @on-sort-change="sortClick">
                <template #row="{ index, column, data }">
                    <!-- <template v-if="column.field === 'number'">
            <div class="flex justify-center">       
                  {{ index }}           
            </div> 
          </template> -->
                    <template v-if="column.field === 'readableCode'">
                        <div class="flex justify-center font-medium">
                            {{ data.ReadableCode || '—' }}
                        </div>
                    </template>
                    <template v-if="column.field === 'logo'">
                        <div class="flex justify-center">
                            <img :src="config.public.origin + '/' + data.photo" alt=""
                                class="w-12 h-12 rounded-full border border-[#1d152a7a]">
                        </div>
                    </template>
                    <template v-if="column.field === 'nameKH'">
                        <div class="flex justify-center">
                            {{ data.fullNameKH }}
                        </div>
                    </template>
                    <template v-if="column.field === 'status'">
                        <div class="flex justify-center">
                            <span v-if="data.status" class="text-blue-700 dark:text-white"> ដំណើការ </span>
                            <span v-else class="text-red-700"> បិទដំណើការ </span>
                        </div>
                    </template>
                    <template v-if="column.field === 'action'">
                        <!--
                          One menu rather than a row of buttons. Six forms with a view
                          and an edit each, plus delete, is thirteen controls per row —
                          unreadable at any width. The menu lists the six ទម្រង់ of the
                          manual and opens each one's view; editing is reached from
                          there, which is the same path form 1 already takes.
                        -->
                        <div class="flex gap-2 justify-center">
                            <TwDropdownMenu align="right" width="72">
                                <template #trigger>
                                    <UButton color="primary" icon="i-heroicons-document-text" class="border">
                                        ទម្រង់
                                    </UButton>
                                </template>
                                <template #content>
                                    <div class="py-1">
                                        <NuxtLink v-for="(form, i) in CASE_FORMS" :key="form.label"
                                            :to="i === 0 ? config.public.origin + '/client/id/' + data.id : ''"
                                            :class="i === 0 ? '' : 'pointer-events-none'">
                                            <div class="flex items-center justify-between gap-3 px-4 py-2 text-sm transition"
                                                :class="i === 0
                                                    ? 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer'
                                                    : 'text-gray-400 dark:text-gray-600'">
                                                <span class="font-[battambang]">
                                                    {{ form.label }} {{ form.title }}
                                                </span>
                                                <span v-if="i !== 0" class="whitespace-nowrap text-xs">
                                                    មិនទាន់មាន
                                                </span>
                                            </div>
                                        </NuxtLink>
                                    </div>
                                </template>
                            </TwDropdownMenu>
                            <UButton color="red" icon="i-heroicons-trash" @click="deleteRecord(data.id)"
                                :disabled="readOnly" :title="'លុបចេញ'" />
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
