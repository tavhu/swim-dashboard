<template>
  <div class="p-4">
    <UCard v-if="serviceCenter">
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ serviceCenter.nameKH }} {{ serviceCenter.nameEN }}
          </h1>
          <UAvatar :src="config.public.origin + '/' + serviceCenter.logo" :alt="serviceCenter.nameEN" size="lg" />
        </div>
      </template>

      <div class="space-y-6">
        <!-- General Details -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ព័ត៌មានមជ្ឈមណ្ឌលសេវាកម្ម
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
            <p><strong>នាយក:</strong> {{ serviceCenter.directorName }}</p>
            <p><strong>អ៊ីមែល:</strong> {{ serviceCenter.email }}</p>
            <p><strong>ទូរស័ព្ទ:</strong> {{ serviceCenter.phoneNumber }}</p>
            <p><strong>ប្រអប់សំបុត្រ:</strong> {{ serviceCenter.PoBox }}</p>
            <p><strong>គេហទំព័រ:</strong> <a :href="serviceCenter.website" target="_blank"
                class="text-primary-500 dark:text-primary-400 hover:underline">{{ serviceCenter.website }}</a></p>
            <p><strong>ប្រភេទ:</strong> {{ serviceCenter.type }}</p>
            <p><strong>ស្ថានភាព:</strong> {{ serviceCenter.status ? 'ដំណើការ' : 'បិទដំណើការ' }}</p>
            <p><strong>កាលបរិច្ឆេទបង្កើត:</strong> {{ new Date(serviceCenter.createdAt).toLocaleDateString() }}</p>
            <p class="md:col-span-2"><strong>អាសយដ្ឋាន:</strong> {{ serviceCenter.Address }}</p>
            <p class="md:col-span-2"><strong>ផែនទីទីតាំង:</strong> <a :href="serviceCenter.locationMap" target="_blank"
                class="text-primary-500 dark:text-primary-400 hover:underline">{{ serviceCenter.locationMap }}</a></p>
          </div>
        </div>

        <!-- Location Details -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ព័ត៌មានលម្អិតអំពីទីតាំង
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
            <p><strong>ក្រុង/ខេត្ត:</strong> {{ serviceCenter.City }}</p>
            <p><strong>ស្រុក/ខណ្ឌ:</strong> {{ serviceCenter.District }}</p>
            <p><strong>ឃុំ/សង្កាត់:</strong> {{ serviceCenter.Commute }}</p>
            <p><strong>ភូមិ:</strong> {{ serviceCenter.Village }}</p>
          </div>
        </div>

        <!-- Overview -->
        <div v-if="serviceCenter.overview">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ទិដ្ឋភាពទូទៅ
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.overview }}</p>
        </div>

        <!-- Background -->
        <div v-if="serviceCenter.background">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ផ្ទៃរឿង
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.background }}</p>
        </div>

        <!-- Mission -->
        <div v-if="serviceCenter.mission">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            បេសកកម្ម
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.mission }}</p>
        </div>

        <!-- Vision -->
        <div v-if="serviceCenter.vision">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ចក្ខុវិស័យ
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.vision }}</p>
        </div>

        <!-- Goal -->
        <div v-if="serviceCenter.goal">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            គោលដៅ
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.goal }}</p>
        </div>

        <!-- Project Summary -->
        <div v-if="serviceCenter.ProjectSummary">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            សេចក្តីសង្ខេបគម្រោង
          </h2>
          <p class="text-gray-700 dark:text-gray-300">{{ serviceCenter.ProjectSummary }}</p>
        </div>

        <!-- Center Plan Table -->
        <div v-if="serviceCenter.CenterPlan && serviceCenter.CenterPlan.length > 0" class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            ផែនការមជ្ឈមណ្ឌល
          </h2>
          <UTable :rows="centerPlanData" :columns="centerPlanColumns">
            <template #filePath-data="{ row }">
              <div v-if="row.filePath && row.filePath.length > 0">
                <div v-for="(path, index) in row.filePath.split(',').filter(p => p.trim())" :key="index">
                  <a :href="config.public.origin + '/' + path.trim()" target="_blank" class="text-blue-500 hover:underline">
                    {{ path.trim().split('/').pop() || 'ទាញយក' }}
                  </a>
                </div>
              </div>
              <span v-else>No file</span>
            </template>
          </UTable>
        </div>

        <!-- Staff Table -->
        <div v-if="serviceCenter.staff && serviceCenter.staff.length > 0" class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            បុគ្គលិកកិច្ចសន្យា
          </h2>
          <UTable :rows="staffData" :columns="staffColumns">
            <template #photo-data="{ row }">
              <UAvatar :src="row.photo" alt="Staff photo" />
            </template>
          </UTable>
        </div>

        <!-- Government Staff Table -->
        <div v-if="serviceCenter.governStaff && serviceCenter.governStaff.length > 0" class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">
            បុគ្គលិករដ្ឋ
          </h2>
          <UTable :rows="governStaffData" :columns="governStaffColumns">
            <template #photo-data="{ row }">
              <UAvatar :src="row.photo" alt="Government Staff photo" />
            </template>
          </UTable>
        </div>
      </div>
    </UCard>

    <div v-else class="flex justify-center items-center p-10">
      <p class="text-gray-500 dark:text-gray-400">កំពុងផ្ទុកព័ត៌មានលម្អិតអំពីមជ្ឈមណ្ឌលសេវាកម្ម...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const config = useRuntimeConfig();
const route = useRoute();
const serviceCenter = ref(null);

// Columns definition for UTable
const staffColumns = [
  { key: 'number', label: 'ល.រ' },
  { key: 'photo', label: 'រូបថត' },
  { key: 'fullName', label: 'ឈ្មោះ' },
  { key: 'fullNameEN', label: 'ឈ្មោះ (អង់គ្លេស)' },
  { key: 'gender', label: 'ភេទ' },
  { key: 'familyEmail', label: 'អ៊ីមែល' },
  { key: 'familyPhoneNumber', label: 'ទូរស័ព្ទ' }
];

const governStaffColumns = [
  { key: 'number', label: 'ល.រ' },
  { key: 'photo', label: 'រូបថត' },
  { key: 'fullNameKH', label: 'ឈ្មោះ (ខ្មែរ)' },
  { key: 'fullNameEN', label: 'ឈ្មោះ (អង់គ្លេស)' },
  { key: 'gender', label: 'ភេទ' },
  { key: 'email', label: 'អ៊ីមែល' },
  { key: 'telephone', label: 'ទូរស័ព្ទ' }
];

const centerPlanColumns = [
    { key: 'number', label: 'ល.រ' },
    { key: 'actvityPlan', label: 'ផែនការសកម្មភាព' },
    { key: 'note', label: 'កំណត់ចំណាំ' },
    { key: 'yearPlan', label: 'ផែនការឆ្នាំ' },
    { key: 'filePath', label: 'ឯកសារ' },
];

const staffData = computed(() =>
  serviceCenter.value?.staff?.map((s, index) => ({
    ...s,
    number: index + 1,
    photo: config.public.origin + '/' + s.photo,
    fullName: `${s.firstName} ${s.lastName}`,
    fullNameEN: `${s.fullnameEN}`
  })) || []
);

const governStaffData = computed(() =>
  serviceCenter.value?.governStaff?.map((s, index) => ({
    ...s,
    number: index + 1,
    photo: config.public.origin + '/' + s.photo,
    fullNameKH: `${s.firstNameKH} ${s.lastNameKH}`,
    fullNameEN: `${s.firstNameEN} ${s.lastNameEN}`
  })) || []
);

const centerPlanData = computed(() =>
  serviceCenter.value?.CenterPlan?.map((p, index) => ({
    ...p,
    number: index + 1,
  })) || []
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
