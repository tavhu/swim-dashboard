<script setup lang="ts">
import {
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
        // {
        //     label: "ល.រ",
        //     field: "number",
        //     width: "50px",
        //     sortable: false,
        //   },
        {
            label: "រូបថត",
            field: "logo",
            width: "150px",
            sortable: false,
        },
        {
            label: "ឈ្មោះជាភាសារខ្មែរ",
            field: "nameKH",
            width: "450px",
            sortable: false,
        },
        {
            label: "ឈ្មោះហៅក្រៅ",
            field: "nameEN",
            width: "300px",
            sortable: false,
        },
        {
            label: "ស្ថានភាព",
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
                    <template v-if="column.field === 'nameEN'">
                        <div class="flex justify-center">
                            {{ data.nickName }}
                        </div>
                    </template>
                    <template v-if="column.field === 'status'">
                        <div class="flex justify-center">
                            <span v-if="data.status" class="text-blue-700 dark:text-white"> ដំណើការ </span>
                            <span v-else class="text-red-700"> បិទដំណើការ </span>
                        </div>
                    </template>
                    <template v-if="column.field === 'action'">
                        <div class="flex gap-2 justify-center">
                            <!--
                              The six ទម្រង់ of the SWIMS manual, in workflow order. They are
                              the same six the ApprovalRecordType enum already carries. Only
                              form 1 exists; forms 2-6 have no page and no table yet, so they
                              are disabled rather than pointed at a route that cannot serve
                              them — these used to link to /center pages with a client id.
                            -->
                            <NuxtLink :to="config.public.origin + '/client/id/' + data.id">
                                <UButton color="gray" icon="i-heroicons-eye" class="border"
                                    :title="CASE_FORMS[0].title + ' — មើល និងបោះពុម្ព'">
                                    មើល
                                </UButton>
                            </NuxtLink>
                            <NuxtLink :to="config.public.origin + '/client/register/' + data.id" target="_BLANK">
                                <UButton color="primary" icon="i-heroicons-pencil-square" class="border"
                                    :disabled="readOnly" :title="CASE_FORMS[0].title + ' — កែសម្រួល'">
                                    {{ CASE_FORMS[0].label }}
                                </UButton>
                            </NuxtLink>
                            <UButton v-for="form in CASE_FORMS.slice(1)" :key="form.label" color="gray"
                                icon="i-heroicons-pencil-square" class="border" disabled
                                :title="form.title + ' — មិនទាន់មាន'">
                                {{ form.label }}
                            </UButton>
                            <UButton color="red" icon="i-heroicons-trash" @click="deleteRecord(data.id)"
                                :disabled="readOnly">
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
