<script setup lang="ts">
import { useToast } from "vue3-tailwind";

/**
 * បញ្ចីមណ្ឌល.
 *
 * The endpoint took a sort but never a search, so the box did nothing; and its
 * count was of the whole table, so the footer disagreed with the rows as soon as
 * anything filtered them. Both are DataTableServer's job now.
 *
 * Four buttons in a row also pushed the table sideways on anything but a wide
 * screen, so the row actions are a dropdown, as the client list does it.
 */
const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const toast = useToast();
const config = useRuntimeConfig();
const table = ref<any>(null);

useHead(() => ({ title: t("title.centres") }));

const columns = [
  { key: "center", label: "មណ្ឌល", sortable: false },
  { key: "nameEN", label: "ឈ្មោះជាភាសាអង់គ្លេស", sortable: true },
  { key: "type", label: "ប្រភេទ", sortable: true, class: "w-[150px]" },
  { key: "directorName", label: "ប្រធានមណ្ឌល", sortable: true, class: "w-[180px]" },
  { key: "status", label: "ស្ថានភាព", sortable: true, class: "w-[130px]" },
  { key: "actions", label: "សកម្មភាព", class: "w-[120px]" },
];

const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>("/api/center/get", {
    method: "post",
    body: {
      limit: String(q.limit),
      skip: String(q.skip),
      q: q.search,
      sortBy: q.sortBy,
      sortType: q.sortType,
    },
  });

const logoUrl = (row: any) =>
  row.logo ? `${config.public.origin}/${row.logo}` : `${config.public.origin}/placeholder.png`;

const deleteRecord = async (row: any) => {
  if (readOnly) return;
  if (!(await confirmDelete(t("confirm.deleteCentre", { name: row?.nameKH ?? "" })))) return;

  try {
    await $fetch("/api/center/delete", { method: "POST", body: { id: row.id } });
    toast.success({ message: t("message.saved") });
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? t("message.notSaved") });
  }
  table.value?.refresh();
};

const openisTrue = ref(false);
const openisKey = ref(0);
const serviceCenterID = ref("");

const addStaff = (CenterID: string) => {
  serviceCenterID.value = CenterID;
  openisTrue.value = true;
  openisKey.value++;
};

const actionItems = (row: any) => [
  [
    {
      label: "មើលព័ត៌មានលំអិត",
      icon: "i-heroicons-eye",
      to: `/center/id/${row.id}`,
    },
    {
      label: "កែសម្រួល",
      icon: "i-heroicons-pencil-square",
      to: `/center?id=${row.id}`,
      disabled: readOnly,
    },
    {
      label: "ចុះឈ្មោះបុគ្គលិកមណ្ឌល",
      icon: "i-heroicons-users",
      click: () => addStaff(row.id),
      disabled: readOnly,
    },
  ],
  [
    {
      label: "លុបចេញ",
      icon: "i-heroicons-trash",
      class: "text-red-600 dark:text-red-400",
      iconClass: "text-red-600 dark:text-red-400",
      click: () => deleteRecord(row),
      disabled: readOnly,
    },
  ],
];
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">បញ្ចីមណ្ឌល</h2>
        <NuxtLink to="/center">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <span class="font-[Moul] text-xl">ចុះឈ្មោះមណ្ឌល</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="nameKH"
        sort-type="asc"
      >
        <template #center-data="{ row }">
          <div class="flex items-center gap-3">
            <img :src="logoUrl(row)" alt=""
              class="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-600" />
            <span class="truncate text-gray-800 dark:text-gray-100">{{ row.nameKH }}</span>
          </div>
        </template>

        <template #nameEN-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.nameEN || '—' }}</span>
        </template>

        <template #type-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.type || '—' }}</span>
        </template>

        <template #directorName-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.directorName || '—' }}</span>
        </template>

        <template #status-data="{ row }">
          <span v-if="row.status" class="text-primary">ដំណើការ</span>
          <span v-else class="text-red-600 dark:text-red-400">បិទដំណើការ</span>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="actionItems(row)" :popper="{ placement: 'bottom-end' }">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </DataTableServer>
    </div>
    <CenterStaffCanvasForm typeEmployee="Official" :readOnly="readOnly" :id="null" :openisTrue="openisTrue"
      :serviceCenterID="serviceCenterID" :key="openisKey" />
  </div>
</template>
