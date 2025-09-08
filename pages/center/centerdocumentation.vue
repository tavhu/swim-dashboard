<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePermissionStore } from '~/stores/permission';

const router = useRouter();
const permissionStore = usePermissionStore();

// --- Page State & Permissions --- //
const pending = ref(true);
const canAdd = computed(() => permissionStore.getPermission('center-documentation')?.create ?? true);
const canEdit = computed(() => permissionStore.getPermission('center-documentation')?.update ?? true);
const canDelete = computed(() => permissionStore.getPermission('center-documentation')?.delete ?? true);

// --- Data --- //
const centerPlans = ref<any[]>([]);
const serviceCenters = ref<any[]>([]);

async function fetchData() {
  pending.value = true;
  try {
    const response = await $fetch<any>('/api/center/plan/get-all');
    centerPlans.value = response.data;
  } catch (error) {
    console.error('Failed to fetch center plans:', error);
  } finally {
    pending.value = false;
  }
}

async function fetchServiceCenters() {
  try {
    const response = await $fetch<any>('/api/center/get', { method: 'POST' });
    serviceCenters.value = response.data;
  } catch (error) {
    console.error('Failed to fetch service centers:', error);
  }
}

onMounted(() => {
  fetchData();
  fetchServiceCenters();
});

// --- Table Columns --- //
const columns = [
  {
    key: 'ServiceCenter.nameKH',
    label: 'មជ្ឈមណ្ឌលសេវាកម្ម',
    sortable: true,
  },
  {
    key: 'actvityPlan',
    label: 'ផែនការសកម្មភាព',
    sortable: true
  },
  {
    key: 'yearPlan',
    label: 'ឆ្នាំ',
    sortable: true
  },
  {
    key: 'filePath',
    label: 'ឯកសារแนบ',
  },
  {
    key: 'note',
    label: 'កំណត់ចំណាំ',
  },
  {
    key: 'actions',
    label: 'Actions'
  }
];

// --- Filtering --- //
const q = ref('');
const selectedCenter = ref('');

const filteredRows = computed(() => {
  let filtered = centerPlans.value;

  if (selectedCenter.value) {
    filtered = filtered.filter(plan => plan.serviceCenterID === selectedCenter.value);
  }

  if (q.value) {
    filtered = filtered.filter(plan => {
      return Object.values(plan).some(value => {
        return String(value).toLowerCase().includes(q.value.toLowerCase());
      });
    });
  }

  return filtered;
});

const serviceCenterOptions = computed(() => [
  { label: 'All Centers', value: '' },
  ...serviceCenters.value.map(center => ({ label: center.nameKH, value: center.id }))
]);

// --- Sorting --- //
const sort = ref({ column: 'yearPlan', direction: 'desc' });

const sortedRows = computed(() => {
  const { column, direction } = sort.value;
  if (!column || !direction) return filteredRows.value;

  return [...filteredRows.value].sort((a, b) => {
    const aValue = getSortValue(a, column);
    const bValue = getSortValue(b, column);

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
});

function getSortValue(obj: any, path: string) {
  return path.split('.').reduce((o, i) => o?.[i], obj)
}

function onSort(newSort: any) {
  sort.value = newSort;
}

// --- Pagination --- //
const page = ref(1);
const pageCount = 10;

const paginatedRows = computed(() => {
  const startIndex = (page.value - 1) * pageCount;
  return sortedRows.value.slice(startIndex, startIndex + pageCount);
});

// --- Actions --- //
const editPlan = (id: string) => {
  router.push(`/center/plan?id=${id}`);
};

const deletePlan = async (id: string) => {
  if (await confirmDialog({ title: 'Confirm Deletion' })) {
    try {
      await $fetch(`/api/center/plan/delete`, { 
        method: 'POST',
        body: { id } 
      });
      await fetchData(); // Refresh data
      toast.success({ message: 'Plan deleted successfully!' });
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error({ message: 'Failed to delete plan.' });
    }
  }
};

const toast = useToast();
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">បញ្ជីឯកសារមជ្ឈមណ្ឌល</h1>
      <UButton v-if="canAdd" @click="router.push('/center/plan')">បន្ថែមឯកសារ</UButton>
    </div>

    <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
        <UInput v-model="q" placeholder="Filter plans..." class="mr-4" />
        <USelect v-model="selectedCenter" :options="serviceCenterOptions" placeholder="Select a center" />
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
              <div v-if="row.filePath && row.filePath.length > 0">
                <div v-for="(path, index) in row.filePath.split(',').filter(p => p)" :key="index">
                    <a :href="path.trim().startsWith('/') ? path.trim() : '/' + path.trim()" target="_blank" class="text-blue-500 hover:underline">
                        {{ path.trim().split('/').pop() || 'View File' }}
                    </a>
                </div>
              </div>
              <span v-else>No file</span>
            </template>

            <!-- Actions template -->
            <template #actions-data="{ row }">
                <div class="flex items-center gap-2">
                    <UButton v-if="canEdit" icon="i-heroicons-pencil-square" size="sm" color="orange" variant="outline" @click="editPlan(row.id)" />
                    <UButton v-if="canDelete" icon="i-heroicons-trash" size="sm" color="red" variant="outline" @click="deletePlan(row.id)" />
                </div>
            </template>
          </UTable>
    </UCard>

    <div v-if="paginatedRows.length > pageCount" class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="filteredRows.length" />
    </div>
  </div>
</template>
