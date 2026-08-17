<script setup lang="ts">
import { useToast } from "vue3-tailwind";
import { useTimeAgo } from "@vueuse/core";

/**
 * បញ្ចីប្រអប់សារ.
 *
 * The search box and the sort headers were inert — the endpoint took neither —
 * and the list refetched by toggling its own page size between 5 and 10, which
 * changed how many rows were on screen as a side effect of saving. Both are now
 * DataTableServer's job, and refreshing is an explicit call.
 */
const messNOtificationNumber = useState<number>("readMessages", () => 0);

const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const toast = useToast();
const table = ref<any>(null);

useHead({ title: "បញ្ចីប្រអប់សារ" });

const columns = [
  { key: "createdAt", label: "កាលបរិច្ឆេទ", sortable: true, class: "w-[150px]" },
  { key: "name", label: "ឈ្មោះមន្ត្រីស្នើសុំ", sortable: true },
  { key: "email", label: "អុីមែល", sortable: true },
  { key: "reason", label: "គោលបំណង", sortable: true },
  { key: "actions", label: "សកម្មភាព", class: "w-[280px]" },
];

const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>("/api/contact/get", {
    method: "post",
    body: {
      limit: String(q.limit),
      skip: String(q.skip),
      q: q.search,
      sortBy: q.sortBy,
      sortType: q.sortType,
    },
  });

const deleteRecord = async (row: any) => {
  if (readOnly) return;
  const who = [row?.name, row?.email].filter(Boolean).join(" · ");
  if (!(await confirmDelete(`លុបសាររបស់ ${who}។`))) return;

  try {
    await $fetch("/api/contact/delete", { method: "POST", body: { id: row.id } });
    toast.success({ message: t("message.saved") });
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? t("message.notSaved") });
  }
  table.value?.refresh();
};

const selectedID = ref("");
const keyIncrement = ref(0);
const openCanvasBoolean = ref(false);
const OpenCanvas = (id: string) => {
  selectedID.value = id;
  openCanvasBoolean.value = true;
  keyIncrement.value++;
};

// Reading a message marks it read, so the list has to reload to lose its
// unread highlight.
watch(messNOtificationNumber, () => {
  if (messNOtificationNumber.value !== 0) table.value?.refresh();
});
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-sm font-[Moul] text-primary lg:text-xl">បញ្ចីប្រអប់សារ</h2>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="createdAt"
        sort-type="desc"
        search-placeholder="ស្វែងរកតាមឈ្មោះ, អុីមែល, គោលបំណង..."
        empty-text="មិនទាន់មានសារនៅឡើយទេ។"
      >
        <template #createdAt-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">
            {{ timeagoInKhmer(useTimeAgo(row.createdAt).value) }}
          </span>
        </template>

        <template #name-data="{ row }">
          <span class="flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <!-- An unread message is the only thing on this row worth flagging. -->
            <span v-if="!row.read" class="h-2 w-2 shrink-0 rounded-full bg-primary" />
            {{ row.name ?? '—' }}
          </span>
        </template>

        <template #email-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.email ?? '—' }}</span>
        </template>

        <template #reason-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.reason ?? '—' }}</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton icon="i-heroicons-eye" size="sm" :color="row.read ? 'gray' : 'primary'"
              :disabled="readOnly" @click="OpenCanvas(row.id)">
              មើលព័ត៌មានលំអិត
            </UButton>
            <UButton color="red" icon="i-heroicons-trash" size="sm" :disabled="readOnly"
              @click="deleteRecord(row)">
              លុបចេញ
            </UButton>
          </div>
        </template>
      </DataTableServer>
    </div>
    <ContactMessageContactDetailsCanvas :openisTrue="openCanvasBoolean" :id="selectedID" :key="keyIncrement" />
  </div>
</template>
