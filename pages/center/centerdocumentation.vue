<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';

const router = useRouter();
const toast = useToast();

// Security
const canCreate = computed(() => !checkIfPageReadOnly());
const canEdit = computed(() => !checkIfPageReadOnly());
const canDelete = computed(() => !checkIfPageReadOnly());

// Table state
const page = ref(1);
const limit = ref(10);
const search = ref('');
const sort = ref({ column: 'yearPlan', direction: 'desc' as 'asc' | 'desc' });

// Columns based on CenterPlan model from prisma schema
const columns = [
  { key: 'ServiceCenter.nameKH', label: 'មជ្ឈមណ្ឌល', sortable: true },
  { key: 'yearPlan', label: 'ឆ្នាំ', sortable: true },
  { key: 'actvityPlan', label: 'ផែនការសកម្មភាព', sortable: true },
  { key: 'note', label: 'កំណត់ចំណាំ', sortable: true },
  { key: 'filePath', label: 'ឯកសារ', sortable: false },
  { key: 'actions', label: 'Actions' },
];

// Data fetching from the correct endpoint for CenterPlan
const { data: result, pending, error, refresh } = useLazyAsyncData<any>(
  'centerPlans',
  () => $fetch('/api/center/plan/get', { method: 'POST' }),
  {
    // No server-side pagination in the API, so we fetch all and handle it on the client
  }
);

const allPlans = computed(() => result.value?.plans || []);

// Client-side filtering and sorting
const filteredAndSortedRows = computed(() => {
  let rows = [...allPlans.value];

  // Client-side Search
  if (search.value) {
    const searchTerm = search.value.toLowerCase();
    rows = rows.filter(item => {
      return (
        item.yearPlan?.toLowerCase().includes(searchTerm) ||
        item.actvityPlan?.toLowerCase().includes(searchTerm) ||
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
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return rows;
});

// Client-side pagination
const paginatedRows = computed(() => {
  const startIndex = (page.value - 1) * limit.value;
  return filteredAndSortedRows.value.slice(startIndex, startIndex + limit.value);
});

const total = computed(() => filteredAndSortedRows.value.length);

// Utility to get nested properties for sorting
function getProperty(obj: any, path: string) {
  return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

// Debounce search input
const onSearch = useDebounceFn((value) => {
  search.value = value;
  page.value = 1; // Reset to first page on search
}, 300);

// Sorting handler
function onSort(s: { column: string; direction: 'asc' | 'desc' }) {
  sort.value = s;
}

// Actions dropdown items
const actionItems = (row: any) => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => router.push(`/center/planform?id=${row.id}`),
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

// Delete logic
async function deletePlan(id: string) {
  if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this plan?' }))) return;

  // This endpoint does not exist yet and needs to be created
  const { error } = await useFetch('/api/center/plan/delete', { 
    method: 'POST',
    body: { id },
  });

  if (error.value) {
    toast.error({ title: 'Error', message: 'Failed to delete plan. The API endpoint may not exist.' });
  } else {
    toast.success({ title: 'Success', message: 'Plan deleted successfully.' });
    refresh(); // Refresh the data from the server
  }
}

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">
        ផែនការមជ្ឈមណ្ឌល
      </h1>
      <!-- Button to add a new plan, links to the plan form -->
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/planform')">
        បន្ថែមថ្មី
      </UButton>
    </div>

    <!-- Search input -->
    <div class="flex justify-end mb-4">
      <UInput :model-value="search" @update:model-value="onSearch" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
      <UTable
        :loading="pending"
        :columns="columns"
        :rows="paginatedRows"
        :sort="sort"
        @sort="onSort"
      >
        <!-- Custom template for Service Center name -->
        <template #ServiceCenter.nameKH-data="{ row }">
          {{ row.ServiceCenter?.nameKH || 'N/A' }}
        </template>
        
        <!-- Custom template for File Path to make it a link -->
        <template #filePath-data="{ row }">
            <a :href="row.filePath" target="_blank" class="text-blue-500 hover:underline" v-if="row.filePath">
                View File
            </a>
            <span v-else>No file</span>
        </template>

        <!-- Custom template for actions dropdown -->
        <template #actions-data="{ row }">
          <UDropdown :items="actionItems(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>

    <!-- Pagination controls -->
    <div v-if="!pending && total > limit" class="flex flex-wrap justify-between items-center mt-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} entries
      </div>
      <UPagination
        v-model="page"
        :page-count="limit"
        :total="total"
      />
    </div>
  </div>
</template>
