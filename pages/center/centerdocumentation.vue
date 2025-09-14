<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';
import { usePermissionStore } from '~/stores/permission';

const router = useRouter();
const toast = useToast();
const permissionStore = usePermissionStore();

useHead({
  title: "ឯកសារកាលប្បវត្តិ",
});


// --- Security --- //
const canCreate = computed(() => permissionStore.getPermission('center-documentation')?.create ?? true);
const canEdit = computed(() => permissionStore.getPermission('center-documentation')?.update ?? true);
const canDelete = computed(() => permissionStore.getPermission('center-documentation')?.delete ?? true);

// --- Table state --- //
const page = ref(1);
const limit = ref(10);
const search = ref('');
const sort = ref({ column: 'yearPlan', direction: 'desc' as 'asc' | 'desc' });

// --- Mappings --- //
const actvityPlanLabels: { [key: string]: string } = {
  yearly: 'ផែនការប្រចាំឆ្នាំ',
  threeyear: 'ផែនការមធ្យម',
  longterm: 'ផែនការរយៈពេលវែង',
};

// --- Columns --- //
const columns = [
  { key: 'ServiceCenter.nameKH', label: 'មជ្ឈមណ្ឌល', sortable: true, class: 'w-2/12' },
  { key: 'yearPlan', label: 'ឆ្នាំ', sortable: true, class: 'w-1/12' },
  { key: 'actvityPlan', label: 'ផែនការសកម្មភាព', sortable: true, class: 'w-3/12' },
  { key: 'note', label: 'កំណត់ចំណាំ', sortable: true, class: 'w-3/12' },
  { key: 'filePath', label: 'ឯកសារ', sortable: false, class: 'w-2/12' },
  { key: 'actions', label: 'Actions', class: 'w-1/12' },
];

// --- Data Fetching --- //
const { data: result, pending, error, refresh } = await useFetch<any>(
  '/api/center/plan/get',
  {
    method: 'POST',
    default: () => ({ plans: [] })
  }
);

const allPlans = computed(() => result.value?.plans || []);

// --- Client-side Filtering and Sorting --- //
const filteredAndSortedRows = computed(() => {
  let rows = allPlans.value ? [...allPlans.value] : [];

  // Client-side Search
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    rows = rows.filter(item => {
      const activityPlanLabel = (actvityPlanLabels[item.actvityPlan] || '').toLowerCase();
      return (
        item.yearPlan?.toLowerCase().includes(searchTerm) ||
        item.actvityPlan?.toLowerCase().includes(searchTerm) ||
        activityPlanLabel.includes(searchTerm) ||
        item.note?.toLowerCase().includes(searchTerm) ||
        item.ServiceCenter?.nameKH?.toLowerCase().includes(searchTerm)
      );
    });
  }

  // Client-side Sort
  if (sort.value.column) {
    const { column, direction } = sort.value;
    rows.sort((a, b) => {
      const aValue = getProperty(a, column);
      const bValue = getProperty(b, column);
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return rows;
});


// --- Client-side Pagination --- //
const paginatedRows = computed(() => {
  const startIndex = (page.value - 1) * limit.value;
  return filteredAndSortedRows.value.slice(startIndex, startIndex + limit.value);
});

const total = computed(() => filteredAndSortedRows.value.length);

// --- Utilities --- //
function getProperty(obj: any, path: string) {
  return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

// --- Event Handlers --- //
const onSearch = useDebounceFn((value) => {
  search.value = value;
  page.value = 1;
}, 300);

function onSort(s: { column: string; direction: 'asc' | 'desc' }) {
  sort.value = s;
}

// --- Actions --- //
const actionItems = (row: any) => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => router.push(`/center/plan?id=${row.id}`),
      disabled: !canEdit.value,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deletePlan(row.id),
      disabled: !canDelete.value,
    },
  ],
];

async function deletePlan(id: string) {
  if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this plan?' }))) return;

  const { error } = await useFetch('/api/center/plan/delete', {
    method: 'POST',
    body: { id },
  });

  if (error.value) {
    toast.error({ title: 'Error', message: 'Failed to delete plan.' });
  } else {
    toast.success({ title: 'Success', message: 'Plan deleted successfully.' });
    refresh();
  }
}

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">
        ផែនការមជ្ឈមណ្ឌល
      </h1>
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/plan')">
        បន្ថែមថ្មី
      </UButton>
    </div>

    <div class="flex justify-end mb-4">
      <UInput :model-value="search" @update:model-value="onSearch" placeholder="Search..."
        icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
      <UTable :loading="pending" :columns="columns" :rows="paginatedRows" :sort="sort" @sort="onSort"
        :ui="{ th: { base: 'whitespace-normal' }, base: 'table-fixed' }">

        <template #ServiceCenter.nameKH-data="{ row }">
          <UTooltip :text="row.ServiceCenter?.nameKH || 'N/A'">
            <p class="truncate">{{ row.ServiceCenter?.nameKH || 'N/A' }}</p>
          </UTooltip>
        </template>

        <template #actvityPlan-data="{ row }">
          <UTooltip :text="actvityPlanLabels[row.actvityPlan] || row.actvityPlan">
            <p class="truncate">{{ actvityPlanLabels[row.actvityPlan] || row.actvityPlan }}</p>
          </UTooltip>
        </template>

        <template #note-data="{ row }">
          <UTooltip :text="row.note || 'N/A'">
            <p class="truncate">{{ row.note || 'N/A' }}</p>
          </UTooltip>
        </template>

        <template #filePath-data="{ row }">
          <div v-if="row.filePath && row.filePath.length > 0">
            <div v-for="(path, index) in row.filePath.split(',').filter(p => p.trim())" :key="index">
              <a :href="path.trim().startsWith('/') ? path.trim() : '/' + path.trim()" target="_blank"
                class="text-blue-500 hover:underline">
                {{ path.trim().split('/').pop() || 'View File' }}
              </a>
            </div>
          </div>
          <span v-else>No file</span>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="actionItems(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>

    <div v-if="!pending && total > limit" class="flex flex-wrap justify-between items-center mt-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} entries
      </div>
      <UPagination v-model="page" :page-count="limit" :total="total" />
    </div>
  </div>
</template>
