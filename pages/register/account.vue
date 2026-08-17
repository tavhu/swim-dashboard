<script setup lang="ts">
import { useToast, type DropdownItem } from "vue3-tailwind";

/**
 * បញ្ចីគណនី.
 *
 * Was a TwDatatableServer with every column marked `sortable: false` and a
 * search box that was sent to an endpoint which ignored it — so neither control
 * did anything. On DataTableServer now, with the search and the sort resolved in
 * the database.
 */
const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const { data: userDataAuth } = useAuth();
const toast = useToast();
const config = useRuntimeConfig();
const table = ref<any>(null);

useHead({ title: "បញ្ចីគណនី" });

const columns = [
  { key: "account", label: "គណនី", sortable: false },
  { key: "username", label: "ឈ្មោះគណនី", sortable: true, class: "w-[200px]" },
  { key: "permission", label: "សិទ្ធិប្រើប្រាស់", sortable: false, class: "w-[180px]" },
  { key: "status", label: "ស្ថានភាពគណនី", sortable: true, class: "w-[150px]" },
  { key: "actions", label: "សកម្មភាព", class: "w-[220px]" },
];

const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>(
    "/api/user/get?" +
      new URLSearchParams({
        limit: String(q.limit),
        skip: String(q.skip),
        q: q.search,
        sortBy: q.sortBy,
        sortType: q.sortType,
      }),
    { method: "get" }
  );

const avatar = (row: any) =>
  row.image ? `${config.public.origin}/${row.image}` : `${config.public.origin}/placeholder.png`;

const deleteRecord = async (row: any) => {
  if (readOnly) return;
  const who = [row?.username, [row?.lastname, row?.firstname].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(" · ");
  if (!(await confirmDelete(`លុបគណនី ${who}។`))) return;

  try {
    await $fetch("/api/user/delete", { method: "POST", body: { id: row.id } });
    toast.success({ message: t("message.saved") });
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? t("message.notSaved") });
  }
  table.value?.refresh();
};

// Which roles this user may act on — an account holding a role outside this list
// is one they are not allowed to delete.
const { data: roleData } = await useFetch("/api/role/get", {
  method: "get",
  //@ts-ignore
  query: { userID: userDataAuth.value?.sub },
});
const roleDataFormat: DropdownItem[] = [];
//@ts-ignore
roleData.value?.data?.forEach((ele: any) => {
  roleDataFormat.push({ label: ele?.name, value: ele?.id });
});

const canDelete = (row: any) =>
  !readOnly && !!roleDataFormat.find((ii) => ii.value == row?.Role?.id);
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-sm font-[Moul] text-primary lg:text-xl">បញ្ចីគណនី</h2>
        <NuxtLink :to="config.public.origin + '/register'">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <span class="font-[Moul] text-sm lg:text-xl">បង្កើតគណនី</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="username"
        sort-type="asc"
        search-placeholder="ស្វែងរកតាមឈ្មោះ ឬឈ្មោះគណនី..."
        empty-text="មិនទាន់មានគណនីនៅឡើយទេ។"
      >
        <template #account-data="{ row }">
          <div class="flex items-center gap-3">
            <img :src="avatar(row)" alt=""
              class="h-10 w-10 shrink-0 rounded-full border border-gray-200 object-cover dark:border-gray-600" />
            <span class="truncate text-gray-800 dark:text-gray-100">
              {{ [row.lastname, row.firstname].filter(Boolean).join(' ') || '—' }}
            </span>
          </div>
        </template>

        <template #username-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.username }}</span>
        </template>

        <template #permission-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.Role?.name ?? '—' }}</span>
        </template>

        <template #status-data="{ row }">
          <span v-if="row.status" class="text-primary">ដំណើការ</span>
          <span v-else class="text-red-600 dark:text-red-400">បិទដំណើការ</span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <NuxtLink :to="config.public.origin + '/register?id=' + row.id">
              <UButton color="primary" icon="i-heroicons-pencil-square" size="sm" :disabled="readOnly">
                កែសម្រួល
              </UButton>
            </NuxtLink>
            <UButton color="red" icon="i-heroicons-trash" size="sm" :disabled="!canDelete(row)"
              @click="deleteRecord(row)">
              លុបចេញ
            </UButton>
          </div>
        </template>
      </DataTableServer>
    </div>
  </div>
</template>
