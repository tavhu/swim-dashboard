<script setup lang="ts">
/**
 * The list table used across the app.
 *
 * Every list screen had its own copy of the search box, the sort handling and
 * the pager, and most of those copies did the work in the browser on whatever
 * page had already been fetched — so searching found nothing on page 2, and
 * sorting reordered ten rows out of two hundred. Here search, sort and paging
 * are parameters of the request; the server does all three and returns the
 * matching total, and the footer counts matches rather than the whole table.
 *
 * The page supplies a `fetcher` and gets back whatever its endpoint returns, so
 * this makes no assumption about the shape of a row. Column cells are rendered
 * through `#<key>-data` slots exactly as UTable's are, and forwarded, so a page
 * keeps full control of its own cells.
 */
import { useDebounceFn } from "@vueuse/core";

const { t } = useI18n();

type SortDirection = "asc" | "desc";

const props = withDefaults(
  defineProps<{
    columns: Array<{ key: string; label: string; sortable?: boolean; class?: string }>;
    /** Called with the current query; returns the page and the matching total. */
    fetcher: (q: {
      search: string;
      limit: number;
      skip: number;
      sortBy: string;
      sortType: SortDirection;
    }) => Promise<{ data: any[]; total: number }>;
    sortBy?: string;
    sortType?: SortDirection;
    searchPlaceholder?: string;
    emptyText?: string;
    /** Page sizes offered; the first is the default. */
    pageSizes?: number[];
  }>(),
  {
    sortType: "desc",
    // Empty means "use the shared default", which has to be resolved in the
    // template — a default here would be evaluated before the locale is known.
    searchPlaceholder: "",
    emptyText: "",
    pageSizes: () => [10, 25, 50, 100],
  }
);

const rows = ref<any[]>([]);
const total = ref(0);
const pending = ref(true);
const failed = ref<string | null>(null);

const page = ref(1);
const limit = ref(props.pageSizes[0]);
const search = ref("");
const searchInput = ref("");
const sort = ref<{ column: string; direction: SortDirection }>({
  column: props.sortBy ?? props.columns.find((c) => c.sortable)?.key ?? "",
  direction: props.sortType,
});

/**
 * One request at a time wins. Typing quickly fires several, and without this a
 * slow early response can land after a fast later one and put stale rows under
 * a newer search term.
 */
let requestId = 0;

const load = async () => {
  const mine = ++requestId;
  pending.value = true;
  failed.value = null;
  try {
    const res = await props.fetcher({
      search: search.value,
      limit: limit.value,
      skip: (page.value - 1) * limit.value,
      sortBy: sort.value.column,
      sortType: sort.value.direction,
    });
    if (mine !== requestId) return;
    rows.value = res?.data ?? [];
    total.value = res?.total ?? 0;
  } catch (e: any) {
    if (mine !== requestId) return;
    rows.value = [];
    total.value = 0;
    failed.value = e?.data?.error ?? e?.message ?? t("table.loadFailed");
  } finally {
    if (mine === requestId) pending.value = false;
  }
};

// A new search term or page size starts again at page 1 — staying on page 5 of
// a result that now has one page shows an empty table for no visible reason.
const onSearch = useDebounceFn((value: string) => {
  search.value = value;
  page.value = 1;
  load();
}, 300);

watch(searchInput, (v) => onSearch(v));
watch([page, limit], load);

const onSort = (s: { column: string; direction: SortDirection }) => {
  sort.value = s;
  page.value = 1;
  load();
};

const clearSearch = () => {
  searchInput.value = "";
  search.value = "";
  page.value = 1;
  load();
};

const from = computed(() => (total.value === 0 ? 0 : (page.value - 1) * limit.value + 1));
const to = computed(() => Math.min(page.value * limit.value, total.value));
const searching = computed(() => search.value.length > 0);

/**
 * A page restored from the back/forward cache does not run onMounted again — it
 * comes back as a frozen DOM snapshot, and if that snapshot was taken while the
 * page was being torn down for the outgoing navigation, it can come back with a
 * collapsed layout and stale rows. Reloading on restore re-renders the table
 * from scratch, which fixes both.
 */
const onPageShow = (e: PageTransitionEvent) => {
  if (e.persisted) load();
};

onMounted(() => {
  load();
  window.addEventListener("pageshow", onPageShow);
});
onBeforeUnmount(() => window.removeEventListener("pageshow", onPageShow));

// So a page can refresh after its own delete or save.
defineExpose({ refresh: load });
</script>

<template>
  <div class="w-full min-w-0 font-[Battambang]">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t('table.show') }}</span>
        <USelect v-model="limit" :options="pageSizes" size="sm" class="w-20" />
        <span class="text-sm text-gray-500 dark:text-gray-400">{{ $t('table.rows') }}</span>
      </div>
      <UInput
        v-model="searchInput"
        :placeholder="searchPlaceholder || $t('table.searchPlaceholder')"
        icon="i-heroicons-magnifying-glass-20-solid"
        size="md"
        class="w-full sm:w-80"
      >
        <template #trailing>
          <UButton
            v-show="searchInput"
            color="gray"
            variant="link"
            icon="i-heroicons-x-mark-20-solid"
            :padded="false"
            @click="clearSearch"
          />
        </template>
      </UInput>
    </div>

    <!-- w-full is explicit: a block child of a flex or grid parent can be
         sized to its content rather than the row, which collapses the card to
         the width of its first column. -->
    <UCard class="w-full" :ui="{ body: { padding: 'px-0 sm:p-0' } }">
      <UTable
        :loading="pending"
        :columns="columns"
        :rows="rows"
        :sort="sort"
        sort-mode="manual"
        @update:sort="onSort"
        :ui="{ th: { font: 'font-normal' }, base: 'min-w-full' }"
      >
        <!-- Forward every cell slot the page defines, so pages keep control of
             their own rendering exactly as they would with a bare UTable. -->
        <template v-for="(_, name) in $slots" #[name]="slotData">
          <slot :name="name" v-bind="slotData ?? {}" />
        </template>

        <template #empty-state>
          <div class="flex flex-col items-center gap-2 py-10 text-center">
            <p v-if="failed" class="text-base text-red-600 dark:text-red-400">{{ failed }}</p>
            <template v-else-if="searching">
              <p class="text-base text-gray-500 dark:text-gray-400">
                {{ $t('table.noResultsFor', { term: search }) }}
              </p>
              <UButton color="gray" size="sm" @click="clearSearch">{{ $t('action.clearSearch') }}</UButton>
            </template>
            <p v-else class="text-base text-gray-500 dark:text-gray-400">{{ emptyText || $t('common.noData') }}</p>
          </div>
        </template>
      </UTable>
    </UCard>

    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div class="text-sm text-gray-500 dark:text-gray-400">
        <template v-if="total">
          {{ $t('table.showing', { from, to, total }) }}
          <span v-if="searching">{{ $t('table.matchingSearch') }}</span>
        </template>
      </div>
      <UPagination v-if="total > limit" v-model="page" :page-count="limit" :total="total" />
    </div>
  </div>
</template>
