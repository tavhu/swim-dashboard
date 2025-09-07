<script setup lang="ts">
import { ref } from "vue";
import { navigateTo } from "#app";

const { data: plansData, pending, error, refresh } = await useFetch('/api/center/plan/get', { method: 'POST' });

const columns = [
  {
    key: 'serviceCenterName',
    label: 'ឈ្មោះមណ្ឌល'
  },
  {
    key: 'actvityPlan',
    label: 'ផែនការសកម្មភាព'
  },
  {
    key: 'yearPlan',
    label: 'ផែនការឆ្នាំ'
  },
  {
    key: 'note',
    label: 'កំណត់ចំណាំ'
  },
  {
    key: 'filePath',
    label: 'ឯកសារ'
  }
];

const getFileName = (path) => {
  if (!path) return '';
  const parts = path.split('/');
  return parts[parts.length - 1];
};

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">ឯកសារមជ្ឈមណ្ឌល</h1>
      <UButton color="primary" @click="navigateTo('/center/plan')">បន្ថែមឯកសារ</UButton>
    </div>

    <UTable 
      v-if="!pending && !error && plansData.plans"
      :rows="plansData.plans"
      :columns="columns"
    >
      <template #filePath-data="{ row }">
        <a v-if="row.filePath" :href="`/${row.filePath}`" target="_blank" class="text-blue-500 hover:underline">
          {{ getFileName(row.filePath) }}
        </a>
        <span v-else>គ្មានឯកសារ</span>
      </template>
      <template #serviceCenterName-data="{ row }">
        {{ row.ServiceCenter ? row.ServiceCenter.nameKH : 'មិនមាន' }}
      </template>
    </UTable>
    <div v-else-if="pending">
      <p>Loading...</p>
    </div>
    <div v-else-if="error">
      <p>An error occurred while fetching the data.</p>
    </div>
  </div>
</template>