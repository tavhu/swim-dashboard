<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';
import { usePermissionStore } from '~/stores/permission';

const router = useRouter();
const toast = useToast();
const permissionStore = usePermissionStore();

// Security
const canCreate = computed(() => permissionStore.getPermission('service')?.create ?? true);
const canEdit = computed(() => permissionStore.getPermission('service')?.update ?? true);
const canDelete = computed(() => permissionStore.getPermission('service')?.delete ?? true);

// Table state
const page = ref(1);
const limit = ref(10);
const search = ref('');
const sort = ref({ column: 'createdAt', direction: 'desc' as 'asc' | 'desc' });

const columns = [
  { key: 'nameKh', label: 'ឈ្មោះសេវា', sortable: true, class: 'w-[15%]' },
  { key: 'providingInstitution', label: 'ក្រសួង/ស្ថាប័ន', sortable: true, class: 'w-[15%]' },
  { key: 'purpose', label: 'គោលបំណង', sortable: true, class: 'w-[10%]' },
  { key: 'legalBasis', label: 'គតិយុត្ត', sortable: true, class: 'w-[10%]' },
  { key: 'eligibleClients', label: 'អតិថិជន', sortable: true, class: 'w-[10%]' },
  { key: 'serviceStandard', label: 'ស្តង់ដារ', sortable: true, class: 'w-[10%]' },
  { key: 'requiredDocuments', label: 'ឯកសារ', sortable: true, class: 'w-[15%]' },
  { key: 'feedback', label: 'យោបល់', sortable: true, class: 'w-[10%]' },
  { key: 'actions', label: 'Actions', class: 'w-[5%]' }
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

    <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
        <UTable
            :loading="pending"
            :columns="columns"
            :rows="services"
            :sort="sort"
            @sort="onSort"
            :ui="{
              base: 'table-fixed w-full'
            }"
        >
          <template #nameKh-data="{ row }">
            <UTooltip :text="row.nameKh || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.nameKh || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #providingInstitution-data="{ row }">
            <UTooltip :text="row.providingInstitution || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.providingInstitution || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #purpose-data="{ row }">
            <UTooltip :text="row.purpose || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.purpose || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #legalBasis-data="{ row }">
            <UTooltip :text="row.legalBasis || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.legalBasis || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #eligibleClients-data="{ row }">
            <UTooltip :text="row.eligibleClients || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.eligibleClients || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #serviceStandard-data="{ row }">
            <UTooltip :text="row.serviceStandard || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.serviceStandard || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #requiredDocuments-data="{ row }">
            <UTooltip :text="row.requiredDocuments || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.requiredDocuments || 'N/A' }}</p>
            </UTooltip>
          </template>

          <template #feedback-data="{ row }">
            <UTooltip :text="row.feedback || 'N/A'" :ui="{ base: 'w-96 whitespace-pre-wrap break-words' }">
              <p class="truncate">{{ row.feedback || 'N/A' }}</p>
            </UTooltip>
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