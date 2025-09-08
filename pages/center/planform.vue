<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from '#app';
import { useToast } from 'vue3-tailwind';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const planId = computed(() => route.query.id as string | undefined);
const isEditMode = computed(() => !!planId.value);

// Reactive state for the form
const state = reactive({
  serviceCenterID: '',
  yearPlan: '',
  actvityPlan: '',
  note: '',
  filePath: '',
});

const serviceCenters = ref<{ id: string; nameKH: string }[]>([]);
const selectedFile = ref<File | null>(null);
const isLoading = ref(false);

// Fetch initial data for the form
onMounted(async () => {
  // Fetch service centers for the dropdown
  try {
    const centersResult = await $fetch<any>('/api/center/get', { method: 'POST' });
    if (centersResult && centersResult.data) {
      serviceCenters.value = centersResult.data;
    }
  } catch (e) {
    toast.error({ title: 'Error', message: 'Could not fetch service centers.' });
  }

  // If in edit mode, fetch the plan data
  if (isEditMode.value) {
    try {
      isLoading.value = true;
      // We need a specific GET-by-ID endpoint, assuming it exists
      const planResult = await $fetch<any>('/api/center/plan/get-by-id', {
        method: 'POST',
        body: { id: planId.value },
      });

      if (planResult && planResult.plan) {
        Object.assign(state, planResult.plan);
      } else {
        toast.error({ title: 'Error', message: 'Plan not found.' });
        router.push('/center/centerdocumentation');
      }
    } catch (e) {
      toast.error({ title: 'Error', message: 'Failed to fetch plan details.' });
    } finally {
      isLoading.value = false;
    }
  }
});

// Handle file selection
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0];
    state.filePath = input.files[0].name; // Show file name in UI
  }
}

// Save or Update the plan
async function save() {
  isLoading.value = true;
  
  // Placeholder for actual file upload logic
  // In a real app, you'd upload the file to a storage service here
  // and get back a URL or path to save in `state.filePath`.
  if (selectedFile.value) {
      // For now, we'll just use a placeholder path.
      // This needs a proper backend implementation for file uploads.
      console.log(`Uploading file: ${selectedFile.value.name}`);
      state.filePath = `/uploads/plans/${selectedFile.value.name}`;
      toast.info({ title: 'File Upload', message: 'File upload is a placeholder. No file was actually uploaded.' })
  }

  try {
    const apiEndpoint = isEditMode.value ? '/api/center/plan/update' : '/api/center/plan/create';
    const body = isEditMode.value ? { ...state, id: planId.value } : state;
    
    // These endpoints need to be created in the backend
    await $fetch(apiEndpoint, {
      method: 'POST',
      body,
    });

    toast.success({
      title: 'Success',
      message: `Plan has been successfully ${isEditMode.value ? 'updated' : 'created'}.`,
    });
    router.push('/center/centerdocumentation');
  } catch (e) {
    toast.error({ title: 'Save Failed', message: 'Could not save the plan. The API endpoint may not exist yet.' });
  } finally {
    isLoading.value = false;
  }
}

function cancel() {
  router.push('/center/centerdocumentation');
}

</script>

<template>
  <div>
    <h1 class="text-2xl font-[Moul] text-primary mb-4">
      {{ isEditMode ? 'កែសម្រួលផែនការមជ្ឈមណ្ឌល' : 'បន្ថែមផែនការមជ្ឈមណ្ឌលថ្មី' }}
    </h1>

    <UCard>
      <div v-if="isLoading" class="flex justify-center items-center h-64">
        <p>Loading...</p>
      </div>
      <UForm v-else :state="state" @submit="save">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <UFormGroup label="មជ្ឈមណ្ឌល (Service Center)" name="serviceCenterID" required>
            <USelect
              v-model="state.serviceCenterID"
              :options="serviceCenters"
              option-attribute="nameKH"
              value-attribute="id"
              placeholder="Select a center"
            />
          </UFormGroup>

          <UFormGroup label="ឆ្នាំ (Year)" name="yearPlan" required>
            <UInput v-model="state.yearPlan" placeholder="e.g., 2024" />
          </UFormGroup>

          <UFormGroup label="ផែនការសកម្មភាព (Activity Plan)" name="actvityPlan" class="md:col-span-2">
            <UTextarea v-model="state.actvityPlan" :rows="5" />
          </UFormGroup>
          
          <UFormGroup label="កំណត់ចំណាំ (Note)" name="note" class="md:col-span-2">
            <UTextarea v-model="state.note" :rows="3" />
          </UFormGroup>

          <UFormGroup label="ឯកសារ (File)" name="filePath">
             <input type="file" @change="onFileChange" class="w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-primary
                hover:file:bg-violet-100"
              />
              <p v-if="state.filePath" class="text-sm mt-2 text-gray-500">Current file: {{ state.filePath }}</p>
          </UFormGroup>

        </div>

        <div class="flex justify-end space-x-4 mt-6">
          <UButton @click="cancel" color="gray">Cancel</UButton>
          <UButton type="submit" :loading="isLoading">Save Plan</UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>
