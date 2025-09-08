<script setup lang="ts">
import { ref, watch, computed } from 'vue';
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
const sort = ref({ column: 'createdAt', direction: 'desc' as 'asc' | 'desc' });

const columns = [
  { key: 'nameKh', label: 'ឈ្មោះសេវា', sortable: true },
  { key: 'providingInstitution', label: 'ក្រសួង/ស្ថាប័ន', sortable: true },
  { key: 'actions', label: 'Actions' }
];

// Data fetching
const { data: result, pending, error, refresh } = useLazyFetch<any>('/api/service', {
  query: {
    search: search,
    offset: computed(() => (page.value - 1) * limit.value),
    limit: limit,
    sortBy: computed(() => sort.value.column),
    sortType: computed(() => sort.value.direction),
  }
});

const services = computed(() => result.value?.data || []);
const total = computed(() => result.value?.total || 0);

// Debounce search
const onSearch = useDebounceFn((value) => {
    search.value = value;
    page.value = 1;
}, 300)

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
      click: () => router.push(`/service/edit/${row.id}`),
      disabled: !canEdit.value,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deleteService(row.id),
      disabled: !canDelete.value,
    },
  ],
];

// Delete logic
async function deleteService(id: string) {
  if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this service?' }))) return;

  const { error } = await useFetch(`/api/service/${id}`, {
    method: 'DELETE',
  });

  if (error.value) {
    toast.error({ message: 'Failed to delete service.' });
  } else {
    toast.success({ message: 'Service deleted successfully.' });
    refresh();
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">
        បញ្ជីសេវាកម្ម
      </h1>
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/service/register')">
        បន្ថែមថ្មី
      </UButton>
    </div>

    <div class="flex justify-end mb-4">
        <UInput :model-value="search" @update:model-value="onSearch" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <UTable
        :loading="pending"
        :columns="columns"
        :rows="services"
        :sort="sort"
        @sort="onSort"
    >
        <template #actions-data="{ row }">
            <UDropdown :items="actionItems(row)">
                <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
            </UDropdown>
        </template>
    </UTable>

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