<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
const sort = ref({ column: 'year', direction: 'desc' as 'asc' | 'desc' });

// Data fetching
const { data: result, pending, error, refresh } = useLazyAsyncData<any>(
  'centerPlans',
  () => $fetch('/api/center/plan/get', { method: 'POST' })
);

const allPlans = computed(() => result.value?.plans || []);

// Client-side filtering and sorting
const filteredAndSortedRows = computed(() => {
  let rows = [...allPlans.value];

  // Search
  if (search.value) {
    rows = rows.filter(item => {
      return Object.values(item).some(value =>
        String(value).toLowerCase().includes(search.value.toLowerCase())
      );
    });
  }

  // Sort
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

const columns = [
  { key: 'ServiceCenter.nameKH', label: 'មជ្ឈមណ្ឌល', sortable: true },
  { key: 'year', label: 'ឆ្នាំ', sortable: true },
  { key: 'description', label: 'ការពិពណ៌នា', sortable: true },
  { key: 'actions', label: 'Actions' },
];

// Utility to get nested properties for sorting
function getProperty(obj: any, path: string) {
  return path.split('.').reduce((o, i) => (o ? o[i] : undefined), obj);
}

// Debounce search
const onSearch = useDebounceFn((value) => {
  search.value = value;
  page.value = 1;
}, 300);

// Sorting
function onSort(s: { column: string; direction: 'asc' | 'desc' }) {
  sort.value = s;
}

// Actions
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
  
  // NOTE: Assuming a delete endpoint exists at /api/center/plan/delete
  const { error } = await useFetch('/api/center/plan/delete', {
    method: 'POST',
    body: { id },
  });

  if (error.value) {
    toast.error({ message: 'Failed to delete plan. The delete API may not exist yet.' });
  } else {
    toast.success({ message: 'Plan deleted successfully.' });
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
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/planform')">
        បន្ថែមថ្មី
      </UButton>
    </div>

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
        <template #ServiceCenter.nameKH-data="{ row }">
          {{ row.ServiceCenter?.nameKH || 'N/A' }}
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
      <UPagination
        v-model="page"
        :page-count="limit"
        :total="total"
      />
    </div>
  </div>
</template>