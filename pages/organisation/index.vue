<script setup lang="ts">
import { ref, computed } from 'vue';
import { useToast } from 'vue3-tailwind';
import CanvasForm from '~/components/organisation/CanvasForm.vue'

useHead({
  title: "អង្គភាព",
});

const toast = useToast();

// Table state
const page = ref(1);
const limit = ref(10);
const search = ref('');
const sort = ref({ column: 'name', direction: 'asc' as 'asc' | 'desc' });

// Canvas state
const isCanvasOpen = ref(false)
const selectedItem = ref(null)

// Data fetching
const { data: result, status, error, refresh } = useLazyFetch<any>('/api/organisation/list', {
  method: 'POST',
  body: {
    search: search,
    skip: computed(() => (page.value - 1) * limit.value),
    limit: limit,
    sortBy: computed(() => sort.value.column),
    sortType: computed(() => sort.value.direction),
  },
  default: () => ({ data: [], total: 0 }),
  watch: [page, search, sort, limit]
});

const organisations = computed(() => result.value?.data || []);
const total = computed(() => result.value?.total || 0);

const columns = [
  { key: 'name', label: 'ឈ្មោះ', sortable: true },
  { key: 'website', label: 'គេហទំព័រ', sortable: true },
  { key: 'email', label: 'អ៊ីមែល', sortable: true },
  { key: 'phoneNumber', label: 'លេខទូរស័ព្ទ', sortable: true },
  { key: 'actions', label: 'Actions' }
];

// Debounce search
const onSearch = useDebounceFn((value: string) => {
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
      click: () => {
        selectedItem.value = row;
        isCanvasOpen.value = true;
      },
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deleteOrganisation(row.id),
    },
  ],
];

// Delete logic
async function deleteOrganisation(id: string) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const { error } = await useFetch(`/api/organisation/delete`, {
    method: 'POST',
    body: { id },
  });

  if (error.value) {
    toast.error({ message: 'Failed to delete item.' });
  } else {
    toast.success({ message: 'Item deleted successfully.' });
    refresh();
  }
}

// Canvas handler
const handleCanvasState = (state: boolean) => {
  isCanvasOpen.value = state;
  if (!state) {
    selectedItem.value = null;
    refresh();
  }
}

const openNewCanvas = () => {
  selectedItem.value = null;
  isCanvasOpen.value = true;
}

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">បញ្ជីអង្គភាព</h1>
      <UButton icon="i-heroicons-plus-circle-20-solid" @click="openNewCanvas">
        បង្កើតថ្មី
      </UButton>
    </div>

    <div class="flex justify-end mb-4">
      <UInput v-model="search" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
      <UTable :loading="status === 'pending'" :columns="columns" :rows="organisations" :sort="sort" @sort="onSort">
        <template #name-data="{ row }">
          <div class="flex items-center gap-2">
            <img :src="row.logo || '/placeholder.png'" class="w-10 h-10 rounded-full object-cover" />
            <span>{{ row.name }}</span>
          </div>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="actionItems(row)">
            <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
          </UDropdown>
        </template>
      </UTable>
    </UCard>

    <div v-if="status !== 'pending' && total > limit" class="flex flex-wrap justify-between items-center mt-4">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        Showing {{ (page - 1) * limit + 1 }} to {{ Math.min(page * limit, total) }} of {{ total }} entries
      </div>
      <UPagination v-model="page" :page-count="limit" :total="total" />
    </div>

    <CanvasForm :open="isCanvasOpen" :item="selectedItem" @update:open="handleCanvasState" />
  </div>
</template>
