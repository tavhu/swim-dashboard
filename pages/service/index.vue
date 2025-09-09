<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';
import { usePermissionStore } from '~/stores/permission';
import ServiceDetailsCanvas from '~/components/service/ServiceDetailsCanvas.vue';

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

// Helper function to truncate text
const truncate = (value: string | null, length = 120) => {
  if (!value || value.length <= length) {
    return value || 'N/A';
  }
  return value.substring(0, length) + '...';
};

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

// Canvas logic
const showCanvas = ref(false);
const canvasTitle = ref('');
const canvasContent = ref('');
const canvasKey = ref(0);

function showDetails(title: string, content: string) {
  canvasTitle.value = title;
  canvasContent.value = content;
  showCanvas.value = true;
  canvasKey.value++; // Increment the key to force re-render
}

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
            :ui="{ base: 'table-fixed w-full' }"
        >
          <template #nameKh-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('ឈ្មោះសេវា', row.nameKh)">{{ truncate(row.nameKh) }}</p>
          </template>

          <template #providingInstitution-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('ក្រសួង/ស្ថាប័ន', row.providingInstitution)">{{ truncate(row.providingInstitution) }}</p>
          </template>

          <template #purpose-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('គោលបំណង', row.purpose)">{{ truncate(row.purpose) }}</p>
          </template>

          <template #legalBasis-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('គតិយុត្ត', row.legalBasis)">{{ truncate(row.legalBasis) }}</p>
          </template>

          <template #eligibleClients-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('អតិថិជន', row.eligibleClients)">{{ truncate(row.eligibleClients) }}</p>
          </template>

          <template #serviceStandard-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('ស្តង់ដារ', row.serviceStandard)">{{ truncate(row.serviceStandard) }}</p>
          </template>

          <template #requiredDocuments-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('ឯកសារ', row.requiredDocuments)">{{ truncate(row.requiredDocuments) }}</p>
          </template>

          <template #feedback-data="{ row }">
            <p class="truncate cursor-pointer" @click="showDetails('យោបល់', row.feedback)">{{ truncate(row.feedback) }}</p>
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

    <ClientOnly>
      <ServiceDetailsCanvas 
        v-model="showCanvas" 
        :title="canvasTitle" 
        :content="canvasContent" 
        :key="canvasKey" 
      />
    </ClientOnly>

  </div>
</template>