<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * អំពីយើង — the ministry describing itself.
 *
 * Supports both Khmer and English.
 * - If only one language is filled → that language is used as default.
 * - If both are filled → the UI switches according to the current locale.
 */
useHead({ title: tr("អំពីយើង") });

const toast = useToast();
const { t, locale } = useI18n();
const permissionStore = usePermissionStore();
const mayEdit = computed(() => permissionStore.hasWritePermission("about"));

const titleKh = ref("");
const titleEn = ref("");
const contentKh = ref("");
const contentEn = ref("");
const updatedAt = ref<string | null>(null);
const pending = ref(true);
const saving = ref(false);
const editing = ref(false);

/** Snapshot so cancelling really cancels. */
const snapshot = ref({
  titleKh: "",
  titleEn: "",
  contentKh: "",
  contentEn: "",
});

/**
 * Display helpers:
 * Prefer the current locale. Fall back to the other language if the preferred
 * one is empty. This is the behaviour the ministry asked for.
 */
const displayTitle = computed(() => {
  if (locale.value === "km" || locale.value === "kh") {
    return titleKh.value || titleEn.value || "";
  }
  return titleEn.value || titleKh.value || "";
});

const displayContent = computed(() => {
  if (locale.value === "km" || locale.value === "kh") {
    return contentKh.value || contentEn.value || "";
  }
  return contentEn.value || contentKh.value || "";
});

const isEmpty = computed(
  () => !titleKh.value && !titleEn.value && !contentKh.value && !contentEn.value
);

const load = async () => {
  pending.value = true;
  try {
    const res: any = await $fetch("/api/about/get");
    titleKh.value = res?.data?.titleKh ?? "";
    titleEn.value = res?.data?.titleEn ?? "";
    contentKh.value = res?.data?.contentKh ?? "";
    contentEn.value = res?.data?.contentEn ?? "";
    updatedAt.value = res?.data?.updatedAt ?? null;
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.loadFailed")) });
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const startEdit = () => {
  snapshot.value = {
    titleKh: titleKh.value,
    titleEn: titleEn.value,
    contentKh: contentKh.value,
    contentEn: contentEn.value,
  };
  editing.value = true;
};

const cancel = () => {
  titleKh.value = snapshot.value.titleKh;
  titleEn.value = snapshot.value.titleEn;
  contentKh.value = snapshot.value.contentKh;
  contentEn.value = snapshot.value.contentEn;
  editing.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    const res: any = await $fetch("/api/about/upsert", {
      method: "POST",
      body: {
        titleKh: titleKh.value,
        titleEn: titleEn.value,
        contentKh: contentKh.value,
        contentEn: contentEn.value,
      },
    });
    updatedAt.value = res?.data?.updatedAt ?? null;
    editing.value = false;
    toast.success({ message: t("message.saved") });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  } finally {
    saving.value = false;
  }
};

const fmt = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mx-auto mt-5 max-w-4xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr("អំពីយើង") }}</h2>
          <p v-if="updatedAt" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ tr("ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ") }}: {{ fmt(updatedAt) }}
          </p>
        </div>
        <div v-if="mayEdit && !editing" class="no-print shrink-0">
          <UButton color="gray" size="xl" @click="startEdit">
            <TwFeather type="edit-2" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t("action.edit") }}</span>
          </UButton>
        </div>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <!-- ========== EDITING ========== -->
      <div v-else-if="editing" class="space-y-6">
        <!-- Khmer section -->
        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h3 class="mb-3 font-[Moul] text-lg text-primary">ភាសាខ្មែរ (Khmer)</h3>

          <label class="block font-bold text-gray-700 dark:text-gray-300" for="about-title-kh">
            {{ tr("ចំណងជើង") }}
          </label>
          <input id="about-title-kh" v-model="titleKh" type="text" :placeholder="tr('ចំណងជើង')"
            class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />

          <label class="mt-4 block font-bold text-gray-700 dark:text-gray-300" for="about-content-kh">
            {{ tr("ខ្លឹមសារ") }}
          </label>
          <textarea id="about-content-kh" v-model="contentKh" rows="12" :placeholder="tr('សរសេរនៅទីនេះ...')"
            class="mt-2 w-full rounded-lg border border-gray-300 p-3 leading-relaxed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
        </div>

        <!-- English section -->
        <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h3 class="mb-3 font-[Moul] text-lg text-primary">English</h3>

          <label class="block font-bold text-gray-700 dark:text-gray-300" for="about-title-en">
            Title
          </label>
          <input id="about-title-en" v-model="titleEn" type="text" placeholder="Title"
            class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />

          <label class="mt-4 block font-bold text-gray-700 dark:text-gray-300" for="about-content-en">
            Content
          </label>
          <textarea id="about-content-en" v-model="contentEn" rows="12" placeholder="Write here..."
            class="mt-2 w-full rounded-lg border border-gray-300 p-3 leading-relaxed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ tr("ចន្លោះជួរដេកនឹងត្រូវបានរក្សាទុកតាមដែលអ្នកសរសេរ") }}
          · If only one language is filled, it will be used as the default.
        </p>

        <div class="flex gap-2">
          <UButton color="primary" size="xl" :loading="saving" @click="save">
            <TwFeather type="save" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t("action.save") }}</span>
          </UButton>
          <UButton color="gray" size="xl" :disabled="saving" @click="cancel">
            <span class="font-[Moul] text-lg">{{ $t("action.cancel") }}</span>
          </UButton>
        </div>
      </div>

      <!-- ========== READING ========== -->
      <div v-else class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 v-if="displayTitle" class="text-xl font-[Moul] text-primary">
          {{ displayTitle }}
        </h3>
        <p v-if="displayContent" class="mt-3 whitespace-pre-line leading-relaxed text-gray-800 dark:text-gray-100">
          {{ displayContent }}
        </p>

        <div v-if="isEmpty" class="py-10 text-center">
          <TwFeather type="file-text" :size="34" class="mx-auto text-gray-400" />
          <p class="mt-3 text-gray-600 dark:text-gray-300">
            {{ tr("មិនទាន់មានខ្លឹមសារនៅឡើយទេ") }}
          </p>
          <UButton v-if="mayEdit" color="primary" class="mt-4" @click="startEdit">
            <span class="font-[Moul]">{{ tr("បន្ថែមខ្លឹមសារ") }}</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>