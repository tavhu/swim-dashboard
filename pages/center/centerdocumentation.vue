<script setup lang="ts">
import { ref, computed } from "vue";
import { navigateTo } from "#app";

const { data: plansData, pending, error, refresh } = await useFetch('/api/center/plan/get', { method: 'POST' });

const activityPlanMap = {
  yearly: 'ផែនការប្រចាំឆ្នាំ',
  threeyear: 'ផែនការមធ្យម',
  longterm: 'ផែនការរយៈពេលវែង',
};

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

const searchQuery = ref('');

const filteredRows = computed(() => {
  if (!plansData.value || !plansData.value.plans) return [];

  let plans = plansData.value.plans.map(plan => ({
    ...plan,
    activityPlanDisplay: activityPlanMap[plan.actvityPlan] || plan.actvityPlan,
  }));

  if (!searchQuery.value) {
    return plans;
  }

  return plans.filter(plan => {
    const searchLower = searchQuery.value.toLowerCase();
    return (
      plan.ServiceCenter?.nameKH.toLowerCase().includes(searchLower) ||
      plan.activityPlanDisplay.toLowerCase().includes(searchLower) ||
      plan.yearPlan.toLowerCase().includes(searchLower) ||
      (plan.note && plan.note.toLowerCase().includes(searchLower))
    );
  });
});


</script>

<template>
  <div class="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-[Moul] text-primary">ឯកសារមជ្ឈមណ្ឌល</h1>
      <UButton color="primary" @click="navigateTo('/center/plan')">បន្ថែមឯកសារ</UButton>
    </div>

    <div class="mb-4">
        <UInput 
            v-model="searchQuery" 
            placeholder="ស្វែងរក..."
            icon="i-heroicons-magnifying-glass-20-solid"
        />
    </div>

    <UTable 
      v-if="!pending && !error && filteredRows"
      :rows="filteredRows"
      :columns="columns"
    >
      <template #filePath-data="{ row }">
        <div v-if="row.filePath">
            <div v-for="(path, index) in row.filePath.split(',')" :key="index">
                <a :href="`/${path}`" target="_blank" class="text-blue-500 hover:underline">
                    {{ getFileName(path) }}
                </a>
            </div>
        </div>
        <span v-else>គ្មានឯកសារ</span>
      </template>
      <template #serviceCenterName-data="{ row }">
        {{ row.ServiceCenter ? row.ServiceCenter.nameKH : 'មិនមាន' }}
      </template>
       <template #actvityPlan-data="{ row }">
        {{ row.activityPlanDisplay }}
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