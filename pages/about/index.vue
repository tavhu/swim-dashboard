<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * អំពីយើង — the ministry describing itself, written from inside the app.
 *
 * One page in two modes rather than a public page plus a separate admin screen.
 * Whoever writes it is the person who most needs to see it as everyone else
 * does, and a separate editor is how the two drift apart.
 *
 * Reading needs only a session; writing needs the `about` grant, which in
 * practice is Super Admin — expressed as a grant rather than hard-coded so it
 * can be delegated without a code change.
 *
 * Khmer, matching the decision that recorded content stays in Khmer. The
 * headings and buttons around it still switch language; the ministry's own words
 * do not, because a half-translated About page reads worse than one in the
 * language it was written in.
 */
useHead({ title: tr("អំពីយើង") });

const toast = useToast();
const { t } = useI18n();
const permissionStore = usePermissionStore();
const mayEdit = computed(() => permissionStore.hasWritePermission("about"));

const title = ref("");
const content = ref("");
const updatedAt = ref<string | null>(null);
const pending = ref(true);
const saving = ref(false);
const editing = ref(false);

/** What was on screen before editing began, so cancelling really cancels. */
const snapshot = ref({ title: "", content: "" });

const load = async () => {
  pending.value = true;
  try {
    const res: any = await $fetch("/api/about/get");
    title.value = res?.data?.title ?? "";
    content.value = res?.data?.content ?? "";
    updatedAt.value = res?.data?.updatedAt ?? null;
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.loadFailed")) });
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const startEdit = () => {
  snapshot.value = { title: title.value, content: content.value };
  editing.value = true;
};

const cancel = () => {
  title.value = snapshot.value.title;
  content.value = snapshot.value.content;
  editing.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    const res: any = await $fetch("/api/about/upsert", {
      method: "POST",
      body: { title: title.value, content: content.value },
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
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mx-auto mt-5 max-w-4xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('អំពីយើង') }}</h2>
          <p v-if="updatedAt" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{ tr('ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ') }}: {{ fmt(updatedAt) }}
          </p>
        </div>
        <div v-if="mayEdit && !editing" class="no-print shrink-0">
          <UButton color="gray" size="xl" @click="startEdit">
            <TwFeather type="edit-2" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.edit') }}</span>
          </UButton>
        </div>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <!-- Editing -->
      <div v-else-if="editing" class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <label class="block font-bold text-gray-700 dark:text-gray-300" for="about-title">
          {{ tr('ចំណងជើង') }}
        </label>
        <input
          id="about-title"
          v-model="title"
          type="text"
          :placeholder="tr('ចំណងជើង')"
          class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        <label class="mt-4 block font-bold text-gray-700 dark:text-gray-300" for="about-content">
          {{ tr('ខ្លឹមសារ') }}
        </label>
        <textarea
          id="about-content"
          v-model="content"
          rows="18"
          :placeholder="tr('សរសេរនៅទីនេះ...')"
          class="mt-2 w-full rounded-lg border border-gray-300 p-3 leading-relaxed dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ tr('ចន្លោះជួរដេកនឹងត្រូវបានរក្សាទុកតាមដែលអ្នកសរសេរ') }}
        </p>

        <div class="mt-4 flex gap-2">
          <UButton color="primary" size="xl" :loading="saving" @click="save">
            <TwFeather type="save" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.save') }}</span>
          </UButton>
          <UButton color="gray" size="xl" :disabled="saving" @click="cancel">
            <span class="font-[Moul] text-lg">{{ $t('action.cancel') }}</span>
          </UButton>
        </div>
      </div>

      <!-- Reading -->
      <div v-else class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
        <h3 v-if="title" class="text-xl font-[Moul] text-primary">{{ title }}</h3>
        <!-- whitespace-pre-line, so the paragraphs the writer typed survive
             without asking them to learn any markup. -->
        <p v-if="content" class="mt-3 whitespace-pre-line leading-relaxed text-gray-800 dark:text-gray-100">
          {{ content }}
        </p>

        <!-- Nothing written yet. Says so, and says who can fix it — an empty
             page with no explanation reads as broken. -->
        <div v-if="!title && !content" class="py-10 text-center">
          <TwFeather type="file-text" :size="34" class="mx-auto text-gray-400" />
          <p class="mt-3 text-gray-600 dark:text-gray-300">{{ tr('មិនទាន់មានខ្លឹមសារនៅឡើយទេ') }}</p>
          <UButton v-if="mayEdit" color="primary" class="mt-4" @click="startEdit">
            <span class="font-[Moul]">{{ tr('បន្ថែមខ្លឹមសារ') }}</span>
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
