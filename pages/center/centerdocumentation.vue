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

// Tabs
const tabItems = ['Contract', 'Official'];
const selectedTab = ref(0);
const employeeType = computed(() => tabItems[selectedTab.value]);

// Table state
const page = ref(1);
const limit = ref(10);
const search = ref('');

// Columns (will be dynamic based on tab)
const columns = computed(() => {
  const baseColumns = [
    { key: 'gender', label: 'Gender', sortable: true },
    { key: 'ServiceCenter.nameKH', label: 'Center', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  if (employeeType.value === 'Contract') {
    return [
      { key: 'lastName', label: 'Last Name', sortable: true },
      { key: 'firstName', label: 'First Name', sortable: true },
      { key: 'position', label: 'Position', sortable: true },
      { key: 'telephone', label: 'Telephone', sortable: true },
      ...baseColumns,
    ];
  } else {
    return [
      { key: 'lastNameKH', label: 'Last Name (Khmer)', sortable: true },
      { key: 'firstNameKH', label: 'First Name (Khmer)', sortable: true },
      ...baseColumns,
    ];
  }
});

// Data fetching
const { data: result, pending, error, refresh } = useLazyAsyncData<any>(
  'staff-documentation',
  () => $fetch('/api/center/staff/get', {
    method: 'POST',
    body: {
      typeEmployee: employeeType.value,
      skip: (page.value - 1) * limit.value,
      limit: limit.value,
    },
  }),
  {
    watch: [page, limit, selectedTab],
  }
);

// Client-side search and filtering
const filteredRows = computed(() => {
  const data = result.value?.data || [];
  if (!search.value) {
    return data;
  }
  return data.filter((item: any) => {
    return Object.values(item).some((value) => {
      return String(value).toLowerCase().includes(search.value.toLowerCase());
    });
  });
});

const total = computed(() => result.value?.total || 0);

// Debounce search
const onSearch = useDebounceFn((value) => {
  search.value = value;
  page.value = 1;
}, 300);

// Actions
const actionItems = (row: any) => [
  [
    {
      label: 'Edit',
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => router.push(`/center/staff?id=${row.id}&type=${employeeType.value}`),
      disabled: !canEdit.value,
    },
  ],
  [
    {
      label: 'Delete',
      icon: 'i-heroicons-trash-20-solid',
      click: () => deleteStaff(row.id),
      disabled: !canDelete.value,
    },
  ],
];

// Delete logic
async function deleteStaff(id: string) {
  if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this staff member?' }))) return;

  const { error } = await useFetch('/api/center/staff/delete', {
    method: 'POST',
    body: { id, type: employeeType.value }, // Assuming API needs type for deletion
  });

  if (error.value) {
    toast.error({ message: 'Failed to delete staff member.' });
  } else {
    toast.success({ message: 'Staff member deleted successfully.' });
    refresh();
  }
}

// Watch for tab changes to reset pagination
watch(selectedTab, () => {
  page.value = 1;
});

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">
        បញ្ជីឯកសារមន្ត្រី
      </h1>
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/staff')">
        បន្ថែមថ្មី
      </UButton>
    </div>

    <UTabs :items="tabItems.map(item => ({ label: item }))" v-model="selectedTab" class="mb-4" />

    <div class="flex justify-end mb-4">
      <UInput :model-value="search" @update:model-value="onSearch" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
        <UTable
            :loading="pending"
            :columns="columns"
            :rows="filteredRows"
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