<script setup lang="ts">
import {
    useToast,
    type DatatableColumn,
    type DatatableData,
    type DropdownItem,
    TwDatatableServer,
} from "vue3-tailwind";

const readOnly = checkIfPageReadOnly()
const { t } = useI18n();
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
            width: "120px",
            sortable: false,
        },
        {
            label: "រូបថត",
            field: "logo",
            width: "90px",
            sortable: false,
        },
        {
            label: "ឈ្មោះជាភាសារខ្មែរ",
            field: "nameKH",
            width: "auto",
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
            width: "150px",
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

const deleteRecord = async (row: any) => {
    if (readOnly) return;
    // Name the client and say what else goes with them: a case file is six
    // forms, the progress notes, the photograph and every attachment.
    const who = [row?.ReadableCode, row?.fullNameKH].filter(Boolean).join(" · ");
    if (!(await confirmDelete(
        `លុបអតិថិជន ${who} និងទិន្នន័យពាក់ព័ន្ធទាំងអស់ (ទម្រង់ទី១-៦, កំណត់ត្រា, រូបថត និងឯកសារភ្ជាប់)។`
    ))) return;
    const id = row.id;

    // Was "/api/center/delete", which calls prisma.serviceCenter.delete() — it
    // looked a client id up in the service-centre table and always failed.
    // $fetch, not useFetch: this runs from a row action, and the response body
    // is wanted so the toast can say what was actually removed.
    try {
        const res: any = await $fetch("/api/client/delete", {
            method: "POST",
            body: { id },
        });
        const d = res?.deleted;
        const forms = d ? d.services + d.casePlans + d.reintegrations + d.followUps + d.closures : 0;
        toast.success({
            message: d
                ? `បានលុប។ ទម្រង់ ${forms} និងឯកសារ ${d.filesRemoved}`
                : t('message.saved'),
        });
    } catch (e: any) {
        toast.error({
            message: e?.data?.error ?? e?.message ?? t('message.notSaved'),
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
// `to` opens what already exists; `create` starts a new one. A form with
// neither is not built yet and shows greyed as មិនទាន់មាន.
//
// Forms 2-6 record an episode rather than a single record, so they offer both:
// the list of what has been recorded, and a direct ចុះឈ្មោះ. Form 1 has only
// `to` — a client cannot be registered twice.
const CASE_FORMS = [
    { label: 'ទម្រង់(១)', title: 'បញ្ជីអតិថិជន', to: (id: string) => `/client/id/${id}` },
    {
        label: 'ទម្រង់(២)', title: 'ការប្រើសេវាកម្មរបស់អតិថិជន',
        to: (id: string) => `/client/service/${id}`,
        create: (id: string) => `/client/service/form?client=${id}`,
    },
    {
        label: 'ទម្រង់(៣)', title: 'ផែនការករណីរបស់អតិថិជន',
        to: (id: string) => `/client/case-plan/${id}`,
        create: (id: string) => `/client/case-plan/form?client=${id}`,
    },
    {
        label: 'ទម្រង់(៤)', title: 'សមាហរណកម្ម',
        to: (id: string) => `/client/reintegration/${id}`,
        create: (id: string) => `/client/reintegration/form?client=${id}`,
    },
    {
        label: 'ទម្រង់(៥)', title: 'តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន',
        to: (id: string) => `/client/follow-up/${id}`,
        create: (id: string) => `/client/follow-up/form?client=${id}`,
    },
    {
        label: 'ទម្រង់(៦)', title: 'បិទករណី',
        to: (id: string) => `/client/case-closure/${id}`,
        create: (id: string) => `/client/case-closure/form?client=${id}`,
    },
]

/**
 * Row actions for UDropdown.
 *
 * UDropdown rather than TwDropdownMenu because the datatable wraps its table in
 * a `vt-overflow-auto` container that clips on both axes: an inline menu was cut
 * off and pushed the table into scrolling, so the forms could not be seen
 * without scrolling sideways. UDropdown teleports out of that container, and it
 * is already how the organisation and centre-document tables do row actions.
 *
 * A row only reaches this list because ទម្រង់ទី១ is registered, and that save is
 * what issues ReadableCode, so the code is what gates the forms hanging off it.
 */
const actionItems = (row: any) => {
    const registered = !!row?.ReadableCode;
    const groups: any[] = CASE_FORMS.map((form) => {
        const entries: any[] = [];
        if (form.to && registered) {
            entries.push({ label: `${form.label} ${form.title}`, icon: 'i-heroicons-document-text', to: form.to(row.id) });
        } else {
            entries.push({ label: `${form.label} ${form.title}`, icon: 'i-heroicons-document-text', disabled: true });
        }
        if (form.create && registered && !readOnly) {
            entries.push({ label: `ចុះឈ្មោះ ${form.label}`, icon: 'i-heroicons-plus', to: form.create(row.id) });
        }
        return entries;
    });
    // Red, and its own group at the bottom: a destructive action should not
    // look like the six navigation entries above it.
    groups.push([{
        label: 'លុបចេញ',
        icon: 'i-heroicons-trash',
        class: 'text-red-600 dark:text-red-400',
        iconClass: 'text-red-600 dark:text-red-400',
        click: () => deleteRecord(row),
        disabled: readOnly,
    }]);
    return groups;
};

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
                        <div class="flex justify-center">
                            <UDropdown :items="actionItems(data)" :popper="{ placement: 'bottom-end' }">
                                <UButton color="primary" icon="i-heroicons-document-text" trailing-icon="i-heroicons-chevron-down-20-solid">
                                    ទម្រង់
                                </UButton>
                            </UDropdown>
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
