<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * កំណត់ត្រាសកម្មភាព — system-wide activity log.
 * UI aligned with feedback-list and approval pages.
 */
useHead({ title: tr("កំណត់ត្រាសកម្មភាព") });

const toast = useToast();
const { t } = useI18n();
const permissionStore = usePermissionStore();

const isSuperAdmin = computed(() => permissionStore.hasWritePermission("role"));

const rows = ref<any[]>([]);
const total = ref(0);
const pending = ref(true);
const error = ref<string | null>(null);

const search = ref("");
const action = ref("");
const entityType = ref("");
const actor = ref("");
const dateFrom = ref("");
const dateTo = ref("");
const page = ref(0);
// Rows per page — user-selectable. Changing it resets to the first page,
// because a page number that meant something at 50 rows points past the end
// at 10.
const take = ref(50);
const TAKE_OPTIONS = [10, 25, 50, 100, 200];
const showFilters = ref(false);

const ACTIONS = ["CREATE", "UPDATE", "DELETE", "SUBMIT", "APPROVE", "REJECT"];
const ENTITY_TYPES = [
    "CLIENT",
    "CLIENT_SERVICE",
    "CASE_PLAN",
    "REINTEGRATION",
    "FOLLOW_UP",
    "CASE_CLOSURE",
    "SERVICE",
    "CENTER",
    "STAFF",
    "GOVERN_STAFF",
    "USER",
    "ROLE",
    "ORGANISATION",
    "CLIENT_TYPE",
    "REFERRAL_TYPE",
    "ABOUT",
    "OTHER",
];

const load = async () => {
    pending.value = true;
    error.value = null;
    try {
        const res: any = await $fetch("/api/activity-log/list", {
            method: "POST",
            body: {
                search: search.value,
                action: action.value || undefined,
                entityType: entityType.value || undefined,
                actor: actor.value || undefined,
                dateFrom: dateFrom.value || undefined,
                dateTo: dateTo.value || undefined,
                take: take.value,
                skip: page.value * take.value,
                sortBy: sortBy.value,
                sortType: sortType.value,
            },
        });
        rows.value = res?.data ?? [];
        total.value = res?.total ?? 0;
        // Filters or a page-size change can leave `page` pointing past the
        // last row (e.g. page 5 at 200/page after switching to 10/page).
        // Pull back to the last valid page instead of showing a permanent
        // empty table.
        const maxPage = Math.max(0, Math.ceil(total.value / take.value) - 1);
        if (page.value > maxPage) {
            page.value = maxPage;
        }
    } catch (e: any) {
        error.value = apiErrorMessage(e, tr("មិនអាចទាញយកទិន្នន័យបានទេ"));
    } finally {
        pending.value = false;
    }
};
onMounted(load);

const onTakeChange = () => {
    page.value = 0;
    load();
};

// Page numbers shown around the current one, with first/last and ellipsis.
const pageWindow = computed<(number | "…")[]>(() => {
    const tp = totalPages.value;
    const cur = page.value + 1;
    if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
    const pages = new Set<number>([1, tp, cur - 1, cur, cur + 1]);
    const sorted = [...pages].filter((n) => n >= 1 && n <= tp).sort((a, b) => a - b);
    const out: (number | "…")[] = [];
    let prev = 0;
    for (const n of sorted) {
        if (n - prev > 1) out.push("…");
        out.push(n);
        prev = n;
    }
    return out;
});

const goToPage = (p: number) => {
    if (p < 0 || p > totalPages.value - 1 || p === page.value) return;
    page.value = p;
    load();
};

// Column sorting — only columns the API whitelist allows (SORTABLE in
// list.post.ts). Clicking a sorted column flips its direction; clicking an
// unsorted one sorts descending by it, newest/strongest first.
const sortBy = ref("createdAt");
const sortType = ref<"asc" | "desc">("desc");

const SORTABLE_COLUMNS: Record<string, string> = {
    createdAt: "createdAt",
    actorName: "actorName",
    action: "action",
    entityType: "entityType",
};

const toggleSort = (col: string) => {
    const key = SORTABLE_COLUMNS[col];
    if (!key) return;
    if (sortBy.value === key) {
        sortType.value = sortType.value === "desc" ? "asc" : "desc";
    } else {
        sortBy.value = key;
        sortType.value = "desc";
    }
    page.value = 0;
    load();
};

const sortIcon = (col: string) => {
    const key = SORTABLE_COLUMNS[col];
    if (!key || sortBy.value !== key) return "";
    return sortType.value === "desc" ? "▼" : "▲";
};

const onSearch = useDebounceFn(() => {
    page.value = 0;
    load();
}, 300);

const applyFilters = () => {
    page.value = 0;
    load();
};

const clearFilters = () => {
    search.value = "";
    action.value = "";
    entityType.value = "";
    actor.value = "";
    dateFrom.value = "";
    dateTo.value = "";
    page.value = 0;
    load();
};

const hasActiveFilters = computed(
    () =>
        !!(
            search.value ||
            action.value ||
            entityType.value ||
            actor.value ||
            dateFrom.value ||
            dateTo.value
        )
);

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / take.value)));

// Range text, e.g. "1–50 of 237"
const rangeLabel = computed(() => {
    if (!total.value) return "";
    const start = page.value * take.value + 1;
    const end = Math.min(total.value, (page.value + 1) * take.value);
    return `${start}–${end} ${tr("ក្នុងចំណោម")} ${total.value}`;
});

const fmt = (d?: string | null) =>
    d
        ? new Date(d).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "—";

const retentionYears = ref(5);
const savingSettings = ref(false);
const purging = ref(false);

const loadSettings = async () => {
    try {
        const res: any = await $fetch("/api/activity-log/settings");
        retentionYears.value = res?.data?.retentionYears ?? 5;
    } catch {
        /* ignore */
    }
};
onMounted(loadSettings);

const saveSettings = async () => {
    savingSettings.value = true;
    try {
        await $fetch("/api/activity-log/settings", {
            method: "POST",
            body: { retentionYears: retentionYears.value },
        });
        toast.success({ message: t("message.saved") });
    } catch (e: any) {
        toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
    } finally {
        savingSettings.value = false;
    }
};

const purgeOld = async () => {
    if (
        !confirm(
            tr("លុបកំណត់ត្រាចាស់តាមរយៈពេលរក្សាទុក?") +
            "\nDelete logs older than retention period?"
        )
    ) {
        return;
    }
    purging.value = true;
    try {
        const res: any = await $fetch("/api/activity-log/purge", { method: "POST" });
        toast.success({ message: `${res?.deleted ?? 0} ${tr("កំណត់ត្រាត្រូវបានលុប")}` });
        load();
    } catch (e: any) {
        toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
    } finally {
        purging.value = false;
    }
};

const actionClass = (a: string) => {
    switch (a) {
        case "CREATE":
            return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
        case "UPDATE":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
        case "DELETE":
            return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
        case "SUBMIT":
            return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
        case "APPROVE":
            return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
        case "REJECT":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200";
        default:
            return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
    }
};
</script>

<template>
    <div class="font-[Battambang]">
        <div class="mt-5">
            <!-- Header — same pattern as feedback-list / approval -->
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-[Moul] text-primary">
                        {{ tr("កំណត់ត្រាសកម្មភាព") }}
                    </h2>
                    <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
                        {{ total }} {{ tr("សរុប") }}
                    </p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                    <UButton color="gray" size="xl" :loading="pending" @click="load">
                        <TwFeather type="refresh-cw" :size="18" class="mr-1" />
                        <span class="font-[Moul] text-lg">{{ tr("ធ្វើបច្ចុប្បន្នភាព") }}</span>
                    </UButton>
                    <UButton :color="showFilters ? 'primary' : 'gray'" size="xl" @click="showFilters = !showFilters">
                        <TwFeather type="filter" :size="18" class="mr-1" />
                        <span class="font-[Moul] text-lg">{{ tr("តម្រង") }}</span>
                    </UButton>
                </div>
            </div>
            <hr class="my-2 border dark:border-gray-700" />

            <!-- Search row — same as feedback-list -->
            <div class="mb-4 flex flex-wrap items-center gap-3">
                <input v-model="search" type="text" :placeholder="tr('ស្វែងរក...')"
                    class="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    @input="onSearch" />
                <UButton v-if="hasActiveFilters" color="gray" size="sm" @click="clearFilters">
                    <TwFeather type="x" :size="14" class="mr-1" />
                    <span class="font-[Moul]">{{ tr("សម្អាត") }}</span>
                </UButton>
            </div>

            <!-- Extra filters (collapsible) -->
            <div v-if="showFilters" class="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                        <label class="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ tr("អ្នកប្រើប្រាស់") }}
                        </label>
                        <input v-model="actor" type="text" :placeholder="tr('ឈ្មោះ ឬ ឈ្មោះអ្នកប្រើ')"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            @keyup.enter="applyFilters" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ tr("សកម្មភាព") }}
                        </label>
                        <select v-model="action"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            @change="applyFilters">
                            <option value="">{{ tr("ទាំងអស់") }}</option>
                            <option v-for="a in ACTIONS" :key="a" :value="a">{{ a }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ tr("ប្រភេទ") }}
                        </label>
                        <select v-model="entityType"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            @change="applyFilters">
                            <option value="">{{ tr("ទាំងអស់") }}</option>
                            <option v-for="e in ENTITY_TYPES" :key="e" :value="e">{{ e }}</option>
                        </select>
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ tr("ពីថ្ងៃ") }}
                        </label>
                        <input v-model="dateFrom" type="date"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            @change="applyFilters" />
                    </div>
                    <div>
                        <label class="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
                            {{ tr("ដល់ថ្ងៃ") }}
                        </label>
                        <input v-model="dateTo" type="date"
                            class="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            @change="applyFilters" />
                    </div>
                </div>
                <div class="mt-3 flex gap-2">
                    <UButton color="primary" size="sm" @click="applyFilters">
                        <span class="font-[Moul]">{{ tr("ស្វែងរក") }}</span>
                    </UButton>
                    <UButton color="gray" size="sm" @click="clearFilters">
                        <span class="font-[Moul]">{{ tr("សម្អាត") }}</span>
                    </UButton>
                </div>
            </div>

            <!-- Retention — Super Admin only, quiet card like other admin panels -->
            <div v-if="isSuperAdmin" class="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                <p class="mb-2 font-[Moul] text-base text-gray-700 dark:text-gray-200">
                    {{ tr("រយៈពេលរក្សាទុក") }}
                </p>
                <div class="flex flex-wrap items-end gap-3">
                    <div>
                        <label class="mb-1 block text-sm text-gray-500 dark:text-gray-400">
                            {{ tr("ឆ្នាំ") }} (0 = {{ tr("រក្សាទុកជារៀងរហូត") }})
                        </label>
                        <input v-model.number="retentionYears" type="number" min="0" max="50"
                            class="w-28 rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
                    </div>
                    <UButton color="primary" size="xl" :loading="savingSettings" @click="saveSettings">
                        <TwFeather type="save" :size="18" class="mr-1" />
                        <span class="font-[Moul] text-lg">{{ $t("action.save") }}</span>
                    </UButton>
                    <UButton color="red" size="xl" :loading="purging" @click="purgeOld">
                        <TwFeather type="trash-2" :size="18" class="mr-1" />
                        <span class="font-[Moul] text-lg">{{ tr("លុបកំណត់ត្រាចាស់") }}</span>
                    </UButton>
                </div>
            </div>

            <!-- Rows per page + result range — above the table -->
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-600 dark:text-gray-300">
                        {{ tr("បង្ហាញ") }}
                    </label>
                    <select v-model.number="take"
                        class="rounded-lg border border-gray-300 px-2 py-1.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        @change="onTakeChange">
                        <option v-for="n in TAKE_OPTIONS" :key="n" :value="n">{{ n }}</option>
                    </select>
                    <span class="text-sm text-gray-600 dark:text-gray-300">{{ tr("ជួរដេក") }}</span>
                </div>
                <p v-if="rangeLabel" class="text-sm text-gray-500 dark:text-gray-400">
                    {{ rangeLabel }}
                </p>
            </div>

            <!-- Loading -->
            <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

            <!-- Error -->
            <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
                <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
            </div>

            <!-- Empty -->
            <div v-else-if="!rows.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
                <TwFeather type="activity" :size="34" class="mx-auto text-gray-400" />
                <p class="mt-3 text-lg text-gray-700 dark:text-gray-200">
                    {{ tr("មិនមានទិន្នន័យ") }}
                </p>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {{ tr("កំណត់ត្រានឹងបង្ហាញនៅពេលមានសកម្មភាពលើទម្រង់") }}
                </p>
            </div>

            <!-- Table — same structure as approval page -->
            <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                <table class="w-full">
                    <thead>
                        <tr class="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                            <th class="cursor-pointer select-none px-4 py-3 font-semibold hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('createdAt')">
                                {{ tr("ពេលវេលា") }} {{ sortIcon("createdAt") }}
                            </th>
                            <th class="cursor-pointer select-none px-4 py-3 font-semibold hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('actorName')">
                                {{ tr("អ្នកប្រើប្រាស់") }} {{ sortIcon("actorName") }}
                            </th>
                            <th class="cursor-pointer select-none px-4 py-3 font-semibold hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('action')">
                                {{ tr("សកម្មភាព") }} {{ sortIcon("action") }}
                            </th>
                            <th class="cursor-pointer select-none px-4 py-3 font-semibold hover:text-gray-700 dark:hover:text-gray-200" @click="toggleSort('entityType')">
                                {{ tr("ប្រភេទ") }} {{ sortIcon("entityType") }}
                            </th>
                            <th class="px-4 py-3 font-semibold">{{ tr("សេចក្ដីសង្ខេប") }}</th>
                            <th class="px-4 py-3 font-semibold">{{ tr("មណ្ឌល") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.id"
                            class="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                            <td class="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {{ fmt(row.createdAt) }}
                            </td>
                            <td class="px-4 py-3">
                                <p class="font-semibold text-gray-800 dark:text-gray-100">
                                    {{ row.actorName || "—" }}
                                </p>
                                <p v-if="row.actorUsername" class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ row.actorUsername }}
                                </p>
                            </td>
                            <td class="px-4 py-3">
                                <span class="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                                    :class="actionClass(row.action)">
                                    {{ row.action }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                {{ row.entityType }}
                            </td>
                            <td class="max-w-xs px-4 py-3 text-gray-800 dark:text-gray-100">
                                {{ row.summary || "—" }}
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                {{ row.centreName || "—" }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination — first / window / last, with prev & next -->
            <div v-if="!pending && !error && totalPages > 1"
                class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <UButton color="gray" size="sm" :disabled="page <= 0" @click="goToPage(page - 1)">
                    ←
                </UButton>
                <template v-for="(p, i) in pageWindow" :key="`${p}-${i}`">
                    <span v-if="p === '…'" class="px-1 text-sm text-gray-400">…</span>
                    <UButton v-else :color="p - 1 === page ? 'primary' : 'gray'" size="sm"
                        @click="goToPage(p - 1)">
                        {{ p }}
                    </UButton>
                </template>
                <UButton color="gray" size="sm" :disabled="page >= totalPages - 1"
                    @click="goToPage(page + 1)">
                    →
                </UButton>
            </div>
        </div>
    </div>
</template>