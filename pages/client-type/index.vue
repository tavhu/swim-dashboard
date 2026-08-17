<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * ប្រភេទអតិថិជន settings list.
 *
 * This is the catalogue behind the ប្រភេទអតិថិជន dropdown on ទម្រង់ទី២, the same
 * way /service is the catalogue behind the សេវាកម្ម dropdown.
 *
 * `readOnly` comes from checkIfPageReadOnly(), which reads the role grants the
 * global permission middleware loaded — the same mechanism the client pages
 * use. The permission *store* is not used here: its getters only expose `read`
 * and `granted`, so the `?.create`/`?.update`/`?.delete` checks written against
 * it elsewhere always came back undefined and fell through to allow.
 */
const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const toast = useToast();
const router = useRouter();

useHead({ title: "ប្រភេទអតិថិជន" });

const page = ref(1);
const limit = ref(10);
const search = ref("");
const sort = ref({ column: "code", direction: "asc" as "asc" | "desc" });

const { data: result, status, refresh } = useLazyFetch<any>("/api/client-type", {
  query: {
    search,
    limit,
    offset: computed(() => (page.value - 1) * limit.value),
    sortBy: computed(() => sort.value.column),
    sortType: computed(() => sort.value.direction),
  },
});

const rows = computed(() => result.value?.data ?? []);
const total = computed(() => result.value?.total ?? 0);

const columns = [
  { key: "code", label: "លេខកូដ", sortable: true, class: "w-[14%]" },
  { key: "nameKh", label: "ឈ្មោះ (ខ្មែរ)", sortable: true, class: "w-[26%]" },
  { key: "nameEn", label: "ឈ្មោះ (អង់គ្លេស)", sortable: true, class: "w-[24%]" },
  { key: "description", label: "បរិយាយ", class: "w-[26%]" },
  { key: "actions", label: "សកម្មភាព", class: "w-[10%]" },
];

const onSearch = useDebounceFn((value: string) => {
  search.value = value;
  page.value = 1;
}, 300);

const onSort = (s: { column: string; direction: "asc" | "desc" }) => (sort.value = s);

const actionItems = (row: any) => [
  [
    {
      label: "កែសម្រួល",
      icon: "i-heroicons-pencil-square-20-solid",
      click: () => router.push(`/client-type/edit/${row.id}`),
      disabled: readOnly,
    },
  ],
  [
    {
      label: "លុបចេញ",
      icon: "i-heroicons-trash-20-solid",
      click: () => remove(row.id),
      disabled: readOnly,
    },
  ],
];

async function remove(id: string) {
  if (readOnly) return;
  if (!(await confirmDialog())) return;

  try {
    const res: any = await $fetch(`/api/client-type/${id}`, { method: "DELETE" });
    // Retiring a category leaves it on the ទម្រង់ទី២ records already filed
    // under it. Saying so is the difference between a reassuring message and a
    // misleading one.
    toast.success({
      message: res?.inUse
        ? `បានដកចេញ។ កំណត់ត្រា ${res.inUse} នៅតែប្រើប្រភេទនេះដដែល`
        : t('message.saved'),
    });
    refresh();
  } catch (e: any) {
    toast.error({ message: e?.data?.statusMessage ?? e?.statusMessage ?? "មិនអាចលុបបានទេ" });
  }
}
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">ប្រភេទអតិថិជន</h2>
        <NuxtLink v-if="!readOnly" to="/client-type/register">
          <UButton color="primary" size="xl">
            <TwFeather type="plus" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.createNew') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div class="mb-4 flex justify-end">
        <UInput :model-value="search" placeholder="ស្វែងរក..." icon="i-heroicons-magnifying-glass-20-solid"
          @update:model-value="onSearch" />
      </div>

      <UCard :ui="{ body: { padding: 'px-0 sm:p-0' } }">
        <UTable :loading="status === 'pending'" :columns="columns" :rows="rows" :sort="sort"
          :ui="{ base: 'table-fixed w-full' }" @sort="onSort">
          <template #code-data="{ row }">
            <span class="font-medium">{{ row.code }}</span>
          </template>
          <template #nameEn-data="{ row }">
            <span>{{ row.nameEn || '—' }}</span>
          </template>
          <template #description-data="{ row }">
            <p class="truncate" :title="row.description">{{ row.description || '—' }}</p>
          </template>
          <template #actions-data="{ row }">
            <UDropdown :items="actionItems(row)" :popper="{ placement: 'bottom-end' }">
              <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-horizontal-20-solid" />
            </UDropdown>
          </template>
          <template #empty-state>
            <div class="py-8 text-center text-base text-gray-500 dark:text-gray-400">
              មិនទាន់មានប្រភេទអតិថិជននៅឡើយទេ
            </div>
          </template>
        </UTable>
      </UCard>

      <div v-if="total > limit" class="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div class="text-sm text-gray-500 dark:text-gray-400">
          បង្ហាញ {{ (page - 1) * limit + 1 }} ដល់ {{ Math.min(page * limit, total) }} ក្នុងចំណោម {{ total }}
        </div>
        <UPagination v-model="page" :page-count="limit" :total="total" />
      </div>
    </div>
  </div>
</template>
