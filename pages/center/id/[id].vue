<template>
  <div class="p-4">
    <UCard v-if="serviceCenter">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ serviceCenter.nameEN }}
          </h1>
          <UAvatar :src="serviceCenter.logo" :alt="serviceCenter.nameEN" size="lg" />
        </div>
      </template>

      <div class="space-y-6">
        <!-- General Details -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            Service Center Information
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
            <p><strong>Director:</strong> {{ serviceCenter.directorName }}</p>
            <p><strong>Email:</strong> {{ serviceCenter.email }}</p>
            <p><strong>Phone:</strong> {{ serviceCenter.phoneNumber }}</p>
            <p><strong>Website:</strong> <a :href="serviceCenter.website" target="_blank" class="text-primary-500 dark:text-primary-400 hover:underline">{{ serviceCenter.website }}</a></p>
            <p class="md:col-span-2"><strong>Address:</strong> {{ serviceCenter.Address }}</p>
          </div>
        </div>

        <!-- Overview -->
        <div v-if="serviceCenter.overview">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            Overview
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.overview }}</p>
        </div>

        <!-- Staff Table -->
        <div v-if="serviceCenter.staff && serviceCenter.staff.length > 0">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            Staff
          </h2>
          <UTable :rows="staffData" :columns="staffColumns" />
        </div>

        <!-- Government Staff Table -->
        <div v-if="serviceCenter.governStaff && serviceCenter.governStaff.length > 0">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            Government Staff
          </h2>
          <UTable :rows="governStaffData" :columns="governStaffColumns" />
        </div>
      </div>
    </UCard>

    <div v-else class="flex justify-center items-center p-10">
      <p class="text-gray-500 dark:text-gray-400">Loading service center details...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const serviceCenter = ref(null);

// Columns definition for UTable
const staffColumns = [
  { key: 'fullName', label: 'Name' },
  { key: 'position', label: 'Position' },
  { key: 'familyEmail', label: 'Email' },
  { key: 'telephone', label: 'Phone' }
];

const governStaffColumns = [
  { key: 'fullNameKH', label: 'Name (KH)' },
  { key: 'fullNameEN', label: 'Name (EN)' },
  { key: 'CurrentRank', label: 'Rank' },
  { key: 'email', label: 'Email' },
  { key: 'telephone', label: 'Phone' }
];

const staffData = computed(() => 
  serviceCenter.value?.staff?.map(s => ({ ...s, fullName: `${s.firstName} ${s.lastName}` })) || []
);

const governStaffData = computed(() => 
  serviceCenter.value?.governStaff?.map(s => ({ ...s, fullNameKH: `${s.firstNameKH} ${s.lastNameKH}`, fullNameEN: `${s.firstNameEN} ${s.lastNameEN}` })) || []
);

onMounted(async () => {
    const id = route.params.id;
    try {
        const response = await fetch(`/api/center/getSingle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id }),
        });
        if (response.ok) {
            serviceCenter.value = await response.json();
        } else {
            console.error('Failed to fetch service center data:', response.statusText);
        }
    } catch (error) {
        console.error('An error occurred while fetching service center data:', error);
    }
});
</script>
