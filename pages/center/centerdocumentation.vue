<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from '#app';
import { useToast } from 'vue3-tailwind';
import { usePermissionStore } from '~/stores/permission';

const router = useRouter();
const toast = useToast();
const permissionStore = usePermissionStore();
const { t } = useI18n();

useHead({
  title: tr("ឯកសារកាលប្បវត្តិ"),
});


// --- Security --- //
// A grant is {read, granted} — there are no create/update/delete fields on it,
// so `?.create ?? true` read undefined and allowed everyone through, whatever
// the role said. The resource key was wrong too: the row is
// `center-centerdocumentation`, matching this page's route name, not
// `center-documentation`. Write actions need `granted`; `read` alone is
// view-only.
const canWrite = computed(() => permissionStore.hasWritePermission('center-centerdocumentation'));
const canCreate = canWrite;
const canEdit = canWrite;
const canDelete = canWrite;

const table = ref<any>(null);

// --- Mappings --- //
const actvityPlanLabels: { [key: string]: string } = {
  yearly: 'ផែនការប្រចាំឆ្នាំ',
  threeyear: 'ផែនការមធ្យម',
  longterm: 'ផែនការរយៈពេលវែង',
};

// --- Columns --- //
const columns = [
  { key: 'ServiceCenter.nameKH', label: tr('មជ្ឈមណ្ឌល'), sortable: true, class: 'w-2/12' },
  { key: 'yearPlan', label: tr('ឆ្នាំ'), sortable: true, class: 'w-1/12' },
  { key: 'actvityPlan', label: tr('ផែនការសកម្មភាព'), sortable: true, class: 'w-3/12' },
  { key: 'note', label: tr('កំណត់ចំណាំ'), sortable: true, class: 'w-3/12' },
  { key: 'filePath', label: tr('ឯកសារ'), sortable: false, class: 'w-2/12' },
  { key: 'actions', label: tr('សកម្មភាព'), class: 'w-1/12' },
];

/**
 * This page used to fetch every plan the caller could see and then search, sort
 * and paginate the array in the browser — so the "of N" counted rows already in
 * memory rather than rows in the table. All three are the server's job now.
 */
const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>('/api/center/plan/get', {
    method: 'POST',
    body: {
      resource: 'center-centerdocumentation',
      limit: String(q.limit),
      skip: String(q.skip),
      q: q.search,
      sortBy: q.sortBy,
      sortType: q.sortType,
    },
  });

// --- Actions --- //
const actionItems = (row: any) => [
  [
    {
      label: tr('កែសម្រួល'),
      icon: 'i-heroicons-pencil-square-20-solid',
      click: () => router.push(`/center/plan?id=${row.id}`),
      disabled: !canEdit.value,
    },
  ],
  [
    {
      label: tr('លុបចេញ'),
      icon: 'i-heroicons-trash-20-solid',
      class: 'text-red-600 dark:text-red-400',
      iconClass: 'text-red-600 dark:text-red-400',
      click: () => deletePlan(row),
      disabled: !canDelete.value,
    },
  ],
];

async function deletePlan(row: any) {
  const what = [row?.ServiceCenter?.nameKH, row?.yearPlan].filter(Boolean).join(' · ');
  if (!(await confirmDelete(t("confirm.deletePlan", { what })))) return;

  try {
    await $fetch('/api/center/plan/delete', { method: 'POST', body: { id: row.id } });
    toast.success({ message: tr("ជោគជ័យ") });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, 'មិនជោគជ័យ')});
  }
  table.value?.refresh();
}

</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-[Moul] text-primary">{{ tr('ផែនការមជ្ឈមណ្ឌល') }}</h1>
      <UButton v-if="canCreate" icon="i-heroicons-plus-circle-20-solid" @click="router.push('/center/plan')">{{ tr('បន្ថែមថ្មី') }}</UButton>
    </div>

    <DataTableServer
      ref="table"
      :columns="columns"
      :fetcher="fetcher"
      sort-by="yearPlan"
      sort-type="desc"
    >
      <template #ServiceCenter.nameKH-data="{ row }">
        <UTooltip :text="row.ServiceCenter?.nameKH || '—'">
          <p class="truncate">{{ row.ServiceCenter?.nameKH || '—' }}</p>
        </UTooltip>
      </template>

      <template #yearPlan-data="{ row }">
        <span class="text-gray-800 dark:text-gray-100">{{ row.yearPlan || '—' }}</span>
      </template>

      <template #actvityPlan-data="{ row }">
        <UTooltip :text="actvityPlanLabels[row.actvityPlan] || row.actvityPlan">
          <p class="truncate">{{ actvityPlanLabels[row.actvityPlan] || row.actvityPlan }}</p>
        </UTooltip>
      </template>

      <template #note-data="{ row }">
        <UTooltip :text="row.note || '—'">
          <p class="truncate">{{ row.note || '—' }}</p>
        </UTooltip>
      </template>

      <template #filePath-data="{ row }">
        <div v-if="row.filePath && row.filePath.length > 0">
          <div v-for="(path, index) in row.filePath.split(',').filter(p => p.trim())" :key="index">
            <a :href="path.trim().startsWith('/') ? path.trim() : '/' + path.trim()" target="_blank"
              class="text-primary hover:underline">
              {{ path.trim().split('/').pop() || 'ឯកសារ' }}
            </a>
          </div>
        </div>
        <span v-else class="text-gray-500 dark:text-gray-400">{{ tr('គ្មានឯកសារ') }}</span>
      </template>

      <template #actions-data="{ row }">
        <UDropdown :items="actionItems(row)" :popper="{ placement: 'bottom-end' }">
          <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
        </UDropdown>
      </template>
    </DataTableServer>
  </div>
</template>
