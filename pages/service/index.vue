<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';

const router = useRouter();
const toast = useToast();

// Security
const readOnly = computed(() => checkIfPageReadOnly());
const canCreate = computed(() => !checkIfPageReadOnly());
const canEdit = computed(() => !checkIfPageReadOnly());
const canDelete = computed(() => !checkIfPageReadOnly());

// Data
const { data: services, pending, error, refresh } = await useFetch('/api/service');

// Table Columns
const columns = [
  { key: 'id', label: 'ID' },
  { key: 'nameKh', label: 'ឈ្មោះសេវា' },
  { key: 'providingInstitution', label: 'ក្រសួង/ស្ថាប័ន' },
  { key: 'actions', label: 'Actions' },
];

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

  const { error } = await useFetch(`/api/service/${id}`, { // Assuming a DELETE endpoint
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

    <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error loading services.</div>
    <div v-else>
        <UTable 
            :rows="services.data" 
            :columns="columns"
        >
            <template #actions-data="{ row }">
                <UDropdown :items="actionItems(row)">
                    <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
                </UDropdown>
            </template>
        </UTable>
    </div>
  </div>
</template>
