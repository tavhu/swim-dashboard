<script setup lang="ts">
import { useToast } from "vue3-tailwind";

/**
 * បញ្ជីអតិថិជន.
 *
 * The table was four columns — code, photo, name, status — and its search and
 * sort controls did nothing: the endpoint ignored both and returned up to a
 * thousand rows ordered by id. It now runs on DataTableServer, so searching and
 * sorting happen in the database and the footer counts matches.
 *
 * The columns are the ones an officer identifies a client by: who they are, sex
 * and age, which centre holds the case, where the record stands in the approval
 * flow, and when they were interviewed.
 */
const readOnly = checkIfPageReadOnly();
const { t } = useI18n();
const toast = useToast();
const config = useRuntimeConfig();
const table = ref<any>(null);

useHead(() => ({ title: t("title.clients") }));

const columns = [
  { key: "ReadableCode", label: tr("លេខសំគាល់"), sortable: true, class: "w-[110px]" },
  { key: "client", label: tr("អតិថិជន"), sortable: false },
  { key: "Gender", label: tr("ភេទ"), sortable: true, class: "w-[80px]" },
  { key: "DOB", label: tr("អាយុ"), sortable: true, class: "w-[90px]" },
  { key: "center", label: tr("មជ្ឈមណ្ឌល"), sortable: false },
  { key: "approvalStatus", label: tr("ស្ថានភាពឯកសារ"), sortable: true, class: "w-[140px]" },
  { key: "status", label: tr("ស្ថានភាព"), sortable: true, class: "w-[110px]" },
  { key: "InterViewDate", label: tr("ថ្ងៃសម្ភាសន៍"), sortable: true, class: "w-[130px]" },
  { key: "actions", label: tr("សកម្មភាព"), class: "w-[130px]" },
];

const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>("/api/client/personalInformationGet", {
    method: "POST",
    body: {
      q: q.search,
      limit: String(q.limit),
      skip: String(q.skip),
      sortBy: q.sortBy,
      sortType: q.sortType,
    },
  });

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Age at today, from the date of birth — what a case officer actually reads. */
const age = (dob?: string | null) => {
  if (!dob) return "—";
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return "—";
  const now = new Date();
  let years = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) years--;
  return years >= 0 && years < 150 ? `${years} ឆ្នាំ` : "—";
};

/** Same vocabulary and colours as the ទម្រង់ទី២-៦ listings. */
const APPROVAL: Record<string, { label: string; classes: string }> = {
  DRAFT: { label: tr("ព្រាង"), classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: tr("បានស្នើសុំ"), classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: tr("បានអនុម័ត"), classes: "bg-primary/10 text-primary" },
  REJECTED: { label: tr("បានបដិសេធ"), classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
};

const deleteRecord = async (row: any) => {
  if (readOnly) return;
  const who = [row?.ReadableCode, row?.fullNameKH].filter(Boolean).join(" · ");
  if (
    !(await confirmDelete(t("confirm.deleteClient", { who })))
  )
    return;

  try {
    const res: any = await $fetch("/api/client/delete", { method: "POST", body: { id: row.id } });
    const d = res?.deleted;
    const forms = d ? d.services + d.casePlans + d.reintegrations + d.followUps + d.closures : 0;
    toast.success({
      message: d
        ? t("deleted.withForms", { forms, files: d.filesRemoved })
        : t("message.saved"),
    });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved"))});
  }
  table.value?.refresh();
};

/**
 * The six national forms, matching the ApprovalRecordType enum. `to` opens what
 * exists, `create` starts a new one. Forms 2-6 record an episode rather than a
 * single record, so they offer both; ទម្រង់ទី១ has only `to`, since a client
 * cannot be registered twice.
 */
const CASE_FORMS = [
  { label: tr("ទម្រង់(១)"), title: tr("បញ្ជីអតិថិជន"), to: (id: string) => `/client/id/${id}` },
  { label: tr("ទម្រង់(២)"), title: tr("ការប្រើសេវាកម្មរបស់អតិថិជន"), to: (id: string) => `/client/service/${id}`, create: (id: string) => `/client/service/form?client=${id}` },
  { label: tr("ទម្រង់(៣)"), title: tr("ផែនការករណីរបស់អតិថិជន"), to: (id: string) => `/client/case-plan/${id}`, create: (id: string) => `/client/case-plan/form?client=${id}` },
  { label: tr("ទម្រង់(៤)"), title: tr("សមាហរណកម្ម"), to: (id: string) => `/client/reintegration/${id}`, create: (id: string) => `/client/reintegration/form?client=${id}` },
  { label: tr("ទម្រង់(៥)"), title: tr("តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន"), to: (id: string) => `/client/follow-up/${id}`, create: (id: string) => `/client/follow-up/form?client=${id}` },
  { label: tr("ទម្រង់(៦)"), title: tr("បិទករណី"), to: (id: string) => `/client/case-closure/${id}`, create: (id: string) => `/client/case-closure/form?client=${id}` },
];

/**
 * A row reaches this menu only because ទម្រង់ទី១ is registered, and that save is
 * what issues ReadableCode — so the code gates the forms hanging off it.
 */
const actionItems = (row: any) => {
  const registered = !!row?.ReadableCode;
  const groups: any[] = CASE_FORMS.map((form) => {
    const entries: any[] = [
      registered
        ? { label: `${form.label} ${form.title}`, icon: "i-heroicons-document-text", to: form.to(row.id) }
        : { label: `${form.label} ${form.title}`, icon: "i-heroicons-document-text", disabled: true },
    ];
    if (form.create && registered && !readOnly) {
      entries.push({ label: `ចុះឈ្មោះ ${form.label}`, icon: "i-heroicons-plus", to: form.create(row.id) });
    }
    return entries;
  });
  // Red, and its own group at the bottom: a destructive action should not look
  // like the six navigation entries above it.
  groups.push([
    {
      label: tr("លុបចេញ"),
      icon: "i-heroicons-trash",
      class: "text-red-600 dark:text-red-400",
      iconClass: "text-red-600 dark:text-red-400",
      click: () => deleteRecord(row),
      disabled: readOnly,
    },
  ]);
  return groups;
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បញ្ចីអតិថិជន') }}</h2>
        <NuxtLink to="/client/register">
          <UButton color="primary" size="xl" :disabled="readOnly">
            <span class="font-[Moul] text-lg">{{ tr('ចុះឈ្មោះអតិថិជន') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="ReadableCode"
        sort-type="desc"
        :search-placeholder="$t('table.searchPlaceholder')"
        
      >
        <template #client-data="{ row }">
          <div class="flex items-center gap-3">
            <EntityAvatar :src="row.photo" :alt="row.fullNameKH" kind="person" />
            <div class="min-w-0">
              <p class="truncate text-gray-800 dark:text-gray-100">{{ row.fullNameKH }}</p>
              <p v-if="row.nickName" class="truncate text-sm text-gray-500 dark:text-gray-400">
                ហៅ {{ row.nickName }}
              </p>
            </div>
          </div>
        </template>

        <template #Gender-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.Gender || '—' }}</span>
        </template>

        <template #DOB-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ age(row.DOB) }}</span>
        </template>

        <template #center-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.ServiceCenter?.nameKH ?? '—' }}</span>
        </template>

        <template #approvalStatus-data="{ row }">
          <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm"
            :class="(APPROVAL[row.approvalStatus] ?? APPROVAL.DRAFT).classes">
            <span class="h-1.5 w-1.5 rounded-full bg-current" />
            {{ (APPROVAL[row.approvalStatus] ?? APPROVAL.DRAFT).label }}
          </span>
        </template>

        <template #status-data="{ row }">
          <span v-if="row.status" class="text-primary">{{ tr('ដំណើការ') }}</span>
          <span v-else class="text-red-600 dark:text-red-400">{{ tr('បិទដំណើការ') }}</span>
        </template>

        <template #InterViewDate-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ fmtDate(row.InterViewDate) }}</span>
        </template>

        <template #actions-data="{ row }">
          <UDropdown :items="actionItems(row)" :popper="{ placement: 'bottom-end' }">
            <UButton color="primary" icon="i-heroicons-document-text"
              trailing-icon="i-heroicons-chevron-down-20-solid" size="sm">{{ tr('ទម្រង់') }}</UButton>
          </UDropdown>
        </template>
      </DataTableServer>
    </div>
  </div>
</template>
