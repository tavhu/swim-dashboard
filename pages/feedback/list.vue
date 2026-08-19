<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * បញ្ជីមតិយោបល់ — what people have said about the system.
 *
 * Behind the `feedback-list` grant, which the ministry hands out: everyone may
 * write, and reading is the part that is decided.
 *
 * Newest first, unlike the approval queue. These two lists look similar and sort
 * opposite ways on purpose — an approval queue is work with a deadline, so the
 * oldest matters most, while feedback is a record of what people are running
 * into now.
 *
 * Marking one handled is a write on the same row, so a read-only grant is
 * meaningful: see what was said without changing its state under whoever is
 * actually working through it.
 */
useHead({ title: tr("បញ្ជីមតិយោបល់") });

const toast = useToast();
const { t } = useI18n();
const permissionStore = usePermissionStore();
const mayHandle = computed(() => permissionStore.hasWritePermission("feedback-list"));

const rows = ref<any[]>([]);
const total = ref(0);
const unhandled = ref(0);
const pending = ref(true);
const error = ref<string | null>(null);
const search = ref("");
const showHandled = ref(false);

const load = async () => {
  pending.value = true;
  error.value = null;
  try {
    const res: any = await $fetch("/api/feedback/list", {
      method: "POST",
      body: { search: search.value, take: 100 },
    });
    rows.value = res?.data ?? [];
    total.value = res?.total ?? 0;
    unhandled.value = res?.unhandled ?? 0;
  } catch (e: any) {
    error.value = apiErrorMessage(e, tr("មិនអាចទាញយកទិន្នន័យបានទេ"));
  } finally {
    pending.value = false;
  }
};
onMounted(load);

// Debounced the way the other list pages do it — see pages/service/index.vue.
const onSearch = useDebounceFn(load, 300);

const shown = computed(() => (showHandled.value ? rows.value : rows.value.filter((r) => !r.handled)));

const setHandled = async (row: any, handled: boolean) => {
  const was = row.handled;
  row.handled = handled; // optimistic: the click should feel immediate
  try {
    await $fetch("/api/feedback/handled", { method: "POST", body: { id: row.id, handled } });
    unhandled.value += handled ? -1 : 1;
  } catch (e: any) {
    row.handled = was;
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  }
};

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បញ្ជីមតិយោបល់') }}</h2>
          <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ unhandled }} {{ tr('មិនទាន់ដោះស្រាយ') }} · {{ total }} {{ tr('សរុប') }}
          </p>
        </div>
        <NuxtLink to="/feedback">
          <UButton color="gray" size="xl">
            <TwFeather type="edit-2" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ tr('សរសេរមតិយោបល់') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div class="mb-4 flex flex-wrap items-center gap-3">
        <input
          v-model="search"
          type="text"
          @input="onSearch"
          :placeholder="tr('ស្វែងរក...')"
          class="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input v-model="showHandled" type="checkbox" class="rounded" />
          {{ tr('បង្ហាញមតិដែលដោះស្រាយរួច') }}
        </label>
      </div>

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <div v-else-if="!shown.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
        <TwFeather type="message-square" :size="34" class="mx-auto text-gray-400" />
        <p class="mt-3 text-lg text-gray-700 dark:text-gray-200">{{ tr('គ្មានមតិយោបល់ទេ') }}</p>
      </div>

      <!-- Cards, not a table: the message is the content and it is a paragraph,
           which a fixed-width cell would either clip or stretch the row for. -->
      <div v-else class="space-y-3">
        <article
          v-for="r in shown"
          :key="r.id"
          class="rounded-lg bg-white p-4 shadow dark:bg-gray-800"
          :class="r.handled ? 'opacity-60' : ''"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-gray-800 dark:text-gray-100">
                {{ r.authorName || tr('អ្នកប្រើប្រាស់') }}
                <span v-if="r.centreName" class="font-normal text-gray-500 dark:text-gray-400">
                  · {{ r.centreName }}
                </span>
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ fmt(r.createdAt) }}</p>
            </div>
            <UButton
              v-if="mayHandle"
              :color="r.handled ? 'gray' : 'primary'"
              size="sm"
              @click="setHandled(r, !r.handled)"
            >
              <TwFeather :type="r.handled ? 'rotate-ccw' : 'check'" :size="15" class="mr-1" />
              <span class="font-[Moul]">{{ r.handled ? tr('បើកឡើងវិញ') : tr('ដោះស្រាយរួច') }}</span>
            </UButton>
          </div>
          <!-- whitespace-pre-line: people write in paragraphs and the line
               breaks they chose are part of what they said. -->
          <p class="mt-3 whitespace-pre-line text-gray-800 dark:text-gray-100">{{ r.message }}</p>
        </article>
      </div>
    </div>
  </div>
</template>
