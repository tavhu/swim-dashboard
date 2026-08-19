<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * មតិយោបល់ — anyone signed in can say what is wrong, or what would help.
 *
 * No categories, no severity, no required subject. Every field added here is one
 * more reason not to bother, and a message someone could not be bothered to
 * write is worth less than a rough one they did. The author, their centre and
 * the time come from the session, so the person writing supplies only the thing
 * only they have.
 */
useHead({ title: tr("មតិយោបល់") });

const toast = useToast();
const { t } = useI18n();
const permissionStore = usePermissionStore();

const message = ref("");
const saving = ref(false);
const sent = ref(false);

/** Whoever may read the list gets a way through to it from here. */
const mayReadList = computed(() => permissionStore.hasPermission("feedback-list"));

const submit = async () => {
  if (!message.value.trim() || saving.value) return;
  saving.value = true;
  try {
    await $fetch("/api/feedback/create", { method: "POST", body: { message: message.value } });
    // Cleared and acknowledged in place: a redirect would leave the writer
    // wondering whether it went.
    message.value = "";
    sent.value = true;
    toast.success({ message: t("message.saved") });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5 mx-auto max-w-3xl">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">{{ tr('មតិយោបល់') }}</h2>
          <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ tr('សូមចែករំលែកមតិ ឬបញ្ហាដែលអ្នកជួបប្រទះក្នុងប្រព័ន្ធ') }}
          </p>
        </div>
        <NuxtLink v-if="mayReadList" to="/feedback/list">
          <UButton color="gray" size="xl">
            <TwFeather type="list" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ tr('បញ្ជីមតិយោបល់') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
        <label class="block font-bold text-gray-700 dark:text-gray-300" for="feedback-message">
          {{ tr('មតិយោបល់របស់អ្នក') }}
        </label>
        <textarea
          id="feedback-message"
          v-model="message"
          rows="8"
          maxlength="5000"
          :placeholder="tr('សរសេរនៅទីនេះ...')"
          class="mt-2 w-full rounded-lg border border-gray-300 p-3 text-base dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
        <div class="mt-1 flex items-center justify-between">
          <!-- Says it plainly: a message signed with your name is a different
               thing to write than an anonymous one, and the writer should know
               which they are sending before they send it. -->
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ tr('ឈ្មោះ និងមជ្ឈមណ្ឌលរបស់អ្នកនឹងត្រូវបានភ្ជាប់ជាមួយមតិនេះ') }}
          </p>
          <span class="text-sm tabular-nums text-gray-400">{{ message.length }}/5000</span>
        </div>

        <div class="mt-4 flex items-center gap-3">
          <UButton color="primary" size="xl" :loading="saving" :disabled="!message.trim()" @click="submit">
            <TwFeather type="send" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ tr('ផ្ញើ') }}</span>
          </UButton>
          <span v-if="sent && !message" class="text-primary">
            {{ tr('អរគុណសម្រាប់មតិយោបល់របស់អ្នក') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
