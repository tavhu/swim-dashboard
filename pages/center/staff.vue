<script setup lang="ts">
import { useToast } from "vue3-tailwind";

/**
 * បុគ្គលិកមណ្ឌល — contract officers and civil servants, two lists on one page.
 *
 * Both were TwDatatableServer with every column `sortable: false` and a search
 * box the endpoint ignored. They are DataTableServer now, each with its own
 * server-side search and sort.
 *
 * Two bugs went with the rewrite:
 *
 *   - the contract table rendered `data.ServiceCenter.nameKH`, but Staff names
 *     that relation `serviceCenter` — only governStaff capitalises it. The
 *     endpoint was selecting the capitalised one too, so the contract list threw
 *     in Prisma and rendered nothing.
 *   - deleteRecord took the kind of staff as an argument and then ignored it,
 *     using the `typeEmployee` ref instead. That ref holds whichever kind the
 *     canvas form last opened, so deleting from one table could delete from the
 *     other's table entirely.
 */
const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const toast = useToast();
const typeEmployee = ref("Contract");

useHead(() => ({ title: t("title.centreStaff") }));

const contractTable = ref<any>(null);
const officialTable = ref<any>(null);

const contractColumns = [
  { key: "name", label: "ឈ្មោះ", sortable: true },
  { key: "position", label: "តួនាទី", sortable: true, class: "w-[180px]" },
  { key: "telephone", label: "ទូរស័ព្ទ", sortable: false, class: "w-[150px]" },
  { key: "center", label: "មណ្ឌល", sortable: false },
  { key: "actions", label: "សកម្មភាព", class: "w-[200px]" },
];

const officialColumns = [
  { key: "name", label: "ឈ្មោះ", sortable: true },
  { key: "gender", label: "ភេទ", sortable: true, class: "w-[100px]" },
  { key: "CurrentRank", label: "ឋានៈ", sortable: true, class: "w-[160px]" },
  { key: "center", label: "មណ្ឌល", sortable: false },
  { key: "actions", label: "សកម្មភាព", class: "w-[200px]" },
];

const makeFetcher = (kind: "Contract" | "Official") => (q: any) =>
  $fetch<{ data: any[]; total: number }>("/api/center/staff/get", {
    method: "post",
    body: {
      limit: String(q.limit),
      skip: String(q.skip),
      q: q.search,
      sortBy: q.sortBy,
      sortType: q.sortType,
      typeEmployee: kind,
    },
  });

const fetchContract = makeFetcher("Contract");
const fetchOfficial = makeFetcher("Official");

const refreshAll = () => {
  contractTable.value?.refresh();
  officialTable.value?.refresh();
};

const openisTrue = ref(false);
const openisKey = ref(0);
const editID = ref("");

/** `kind` is the table the row came from — not the ref, which tracks the form. */
const deleteRecord = async (row: any, kind: "Contract" | "Official") => {
  if (readOnly) return;
  const who =
    kind === "Contract"
      ? [row?.lastName, row?.firstName].filter(Boolean).join(" ")
      : [row?.lastNameKH, row?.firstNameKH].filter(Boolean).join(" ");
  if (!(await confirmDelete(t("confirm.deleteStaff", { name: who })))) return;

  try {
    await $fetch("/api/center/staff/delete", {
      method: "POST",
      body: { id: row.id, typeEmployee: kind },
    });
    toast.success({ message: "ជោគជ័យ" });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, "មិនជោគជ័យ")});
  }
  refreshAll();
};

const editRecord = (id: string, kind: string) => {
  if (readOnly) return;
  typeEmployee.value = kind;
  openisTrue.value = true;
  openisKey.value++;
  editID.value = id;
};

const openRegisterForm = (kind: string) => {
  typeEmployee.value = kind;
  openisTrue.value = true;
  openisKey.value++;
  editID.value = "";
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-md font-[Moul] text-primary lg:text-2xl">បញ្ចីមន្ត្រីកិច្ចសន្យា</h2>
        <UButton color="primary" size="xl" :disabled="readOnly" @click="openRegisterForm('Contract')">
          <span class="font-[Moul] text-sm lg:text-xl">ចុះឈ្មោះមន្ត្រីកិច្ចសន្យា</span>
        </UButton>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="contractTable"
        :columns="contractColumns"
        :fetcher="fetchContract"
        sort-by="firstName"
        sort-type="asc"
      >
        <template #name-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">
            {{ [row.lastName, row.firstName].filter(Boolean).join(' ') || '—' }}
          </span>
        </template>
        <template #position-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.position || '—' }}</span>
        </template>
        <template #telephone-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.telephone || '—' }}</span>
        </template>
        <!-- Lowercase: Staff.serviceCenter, unlike governStaff.ServiceCenter. -->
        <template #center-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.serviceCenter?.nameKH ?? '—' }}</span>
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil-square" size="sm" color="primary" :disabled="readOnly"
              @click="editRecord(row.id, 'Contract')">
              កែសម្រួល
            </UButton>
            <UButton icon="i-heroicons-trash" size="sm" color="red" :disabled="readOnly"
              @click="deleteRecord(row, 'Contract')">
              លុបចេញ
            </UButton>
          </div>
        </template>
      </DataTableServer>
    </div>

    <div class="mt-8">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-md font-[Moul] text-primary lg:text-2xl">បញ្ចីមន្ត្រីរាជការ</h2>
        <UButton color="primary" size="xl" :disabled="readOnly" @click="openRegisterForm('Official')">
          <span class="font-[Moul] text-sm lg:text-xl">ចុះឈ្មោះមន្ត្រីរាជការ</span>
        </UButton>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="officialTable"
        :columns="officialColumns"
        :fetcher="fetchOfficial"
        sort-by="firstNameKH"
        sort-type="asc"
      >
        <template #name-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">
            {{ [row.lastNameKH, row.firstNameKH].filter(Boolean).join(' ') || '—' }}
          </span>
        </template>
        <template #gender-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.gender || '—' }}</span>
        </template>
        <template #CurrentRank-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.CurrentRank || '—' }}</span>
        </template>
        <template #center-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.ServiceCenter?.nameKH ?? '—' }}</span>
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-pencil-square" size="sm" color="primary" :disabled="readOnly"
              @click="editRecord(row.id, 'Official')">
              កែសម្រួល
            </UButton>
            <UButton icon="i-heroicons-trash" size="sm" color="red" :disabled="readOnly"
              @click="deleteRecord(row, 'Official')">
              លុបចេញ
            </UButton>
          </div>
        </template>
      </DataTableServer>
    </div>

    <CenterStaffCanvasForm @canvasIsOpen="refreshAll" :typeEmployee="typeEmployee" :readOnly="readOnly"
      :id="editID" :openisTrue="openisTrue" :serviceCenterID="null" :key="openisKey" />
  </div>
</template>
