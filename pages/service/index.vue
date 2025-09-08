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

// Search
const searchQuery = ref('');

// Data
const { data: services, pending, error, refresh } = await useFetch('/api/service', {
    query: { q: searchQuery },
    watch: [searchQuery]
});

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

async function deleteService(id: string) {
  if (!(await confirmDialog({ title: 'Confirm Deletion', message: 'Are you sure you want to delete this service?' }))) return;

  const { error } = await useFetch(`/api/service/${id}`, {
    method: 'DELETE',
  });

  if (error.value) {
    toast.error({ message: 'Failed to delete service.' });
  } else {
    toast.success({ message: 'Service deleted successfully.' });
    refresh(); // Refresh the data
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
        <UInput v-model="searchQuery" placeholder="Search..." icon="i-heroicons-magnifying-glass-20-solid" />
    </div>

    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error loading services.</div>
    
    <div v-else class="space-y-4">
        <UCard v-for="service in services.data" :key="service.id">
            <template #header>
                <div class="flex justify-between items-center">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ service.nameKh }}
                    </h2>
                    <UDropdown :items="actionItems(service)">
                        <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
                    </UDropdown>
                </div>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-gray-700 dark:text-gray-300">
                <p><strong class="dark:text-white">ក្រសួង/ស្ថាប័ន ផ្តល់សេវា:</strong> {{ service.providingInstitution }}</p>
                <p><strong class="dark:text-white">គោលបំណង នៃការផ្តល់សេវា:</strong> {{ service.purpose }}</p>
                <p><strong class="dark:text-white">មូលដ្ឋានគតិយុត្ត:</strong> {{ service.legalBasis }}</p>
                <p><strong class="dark:text-white">អតិថិជនដែលមាន សិទ្ធិទទួលសេវា:</strong> {{ service.eligibleClients }}</p>
                <p class="md:col-span-2"><strong class="dark:text-white">ស្តង់ដារសេវា:</strong> {{ service.serviceStandard }}</p>
                <p class="md:col-span-2"><strong class="dark:text-white">តម្រូវការឯកសារ ដើម្បីទទួលបានសេវា:</strong> {{ service.requiredDocuments }}</p>
                <p class="md:col-span-2"><strong class="dark:text-white">យោបល់:</strong> {{ service.feedback }}</p>
            </div>
        </UCard>
    </div>
  </div>
</template>