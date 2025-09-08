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
const sort = ref({ column: 'nameEN', direction: 'asc' as 'asc' | 'desc' });

// Columns
const columns = [
    { key: 'nameEN', label: 'Center Name (English)', sortable: true },
    { key: 'nameKH', label: 'Center Name (Khmer)', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'address', label: 'Address', sortable: true },
    { key: 'actions', label: 'Actions' },
];

// Data fetching
const { data: result, pending, error, refresh } = useLazyAsyncData<any>(
    'centers',
    () => $fetch('/api/center/get', {
        method: 'POST',
        body: {
            page: page.value,
            limit: limit.value,
            sortBy: sort.value.column,
            sortType: sort.value.direction,
            search: search.value,
        }
    }),
    { 
        watch: [page, limit, sort, search],
    }
);

const centers = computed(() => result.value?.data || []);
const total = computed(() => result.value?.total || 0);

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
      click: () => router.push(`/center/formcenter?id=${row.id}`),
      disabled: !canEdit.value,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deleteCenter(row.id),
      disabled: !canDelete.value,
    },
  ],
];

// Delete logic
async function deleteCenter(id: string) {
    if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this center?' }))) return;

    const { error } = await useFetch('/api/center/delete', {
        method: 'POST',
        body: { id },
    });

    if (error.value) {
        toast.error({ message: 'Failed to delete center.' });
    } else {
        toast.success({ message: 'Center deleted successfully.' });
        refresh();
    }
}

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">
        បញ្ជីមជ្ឈមណ្ឌល
      </h1>
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/formcenter')">
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
            :rows="centers"
            :sort="sort"
            @sort="onSort"
        >
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