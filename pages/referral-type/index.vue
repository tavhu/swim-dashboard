<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * ប្រភេទសេវាបញ្ជូន — the list behind the referral form's dropdown.
 *
 * One page, edited in place, rather than the list-plus-register-page pair the
 * older reference tables use. The rows are two fields long; sending someone to
 * another screen to type a name is more navigation than the task deserves.
 *
 * A type already used by a referral is deactivated instead of deleted — the
 * server decides that, not this page, and says which it did.
 */
useHead({ title: tr("ប្រភេទសេវាបញ្ជូន") });

const toast = useToast();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();

const rows = ref<any[]>([]);
const pending = ref(true);
const saving = ref(false);
const draft = reactive({ id: "", nameKh: "", nameEn: "", description: "" });

const load = async () => {
  pending.value = true;
  try {
    const res: any = await $fetch("/api/referral-type");
    rows.value = res?.data ?? [];
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.loadFailed")) });
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const reset = () => Object.assign(draft, { id: "", nameKh: "", nameEn: "", description: "" });
const edit = (r: any) =>
  Object.assign(draft, { id: r.id, nameKh: r.nameKh, nameEn: r.nameEn ?? "", description: r.description ?? "" });

const save = async () => {
  if (!draft.nameKh.trim() || saving.value) return;
  saving.value = true;
  try {
    await $fetch("/api/referral-type/upsert", { method: "POST", body: { ...draft } });
    toast.success({ message: t("message.saved") });
    reset();
    await load();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  } finally {
    saving.value = false;
  }
};

const remove = async (r: any) => {
  if (!(await confirmDelete(r.nameKh))) return;
  try {
    const res: any = await $fetch("/api/referral-type/delete", { method: "POST", body: { id: r.id } });
    // Says which happened: "deleted" and "hidden from new referrals" are
    // different outcomes and the user should not have to guess which they got.
    toast.success({
      message: res?.message === "deactivated" ? tr("ត្រូវបានបិទដំណើរការ ព្រោះមានការបញ្ជូនប្រើប្រាស់រួចហើយ") : t("message.deleted"),
    });
    await load();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  }
};

const toggleActive = async (r: any) => {
  try {
    await $fetch("/api/referral-type/upsert", { method: "POST", body: { ...r, isActive: !r.isActive } });
    await load();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  }
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <h2 class="text-2xl font-[Moul] text-primary">{{ tr('ប្រភេទសេវាបញ្ជូន') }}</h2>
      <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
        {{ tr('បញ្ជីនេះបង្ហាញនៅក្នុងទម្រង់ការបញ្ជូន') }}
      </p>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="!readOnly" class="mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-12 lg:col-span-4">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">{{ tr('ឈ្មោះ (ខ្មែរ)') }}</label>
            <input v-model="draft.nameKh" type="text" required
              class="mt-1 w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </div>
          <div class="col-span-12 lg:col-span-4">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">{{ tr('ឈ្មោះ (អង់គ្លេស)') }}</label>
            <input v-model="draft.nameEn" type="text"
              class="mt-1 w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </div>
          <div class="col-span-12 lg:col-span-4">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">{{ tr('បរិយាយ') }}</label>
            <input v-model="draft.description" type="text"
              class="mt-1 w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100" />
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <UButton color="primary" :loading="saving" :disabled="!draft.nameKh.trim()" @click="save">
            <TwFeather :type="draft.id ? 'save' : 'plus'" :size="16" class="mr-1" />
            <span class="font-[Moul]">{{ draft.id ? $t('action.save') : tr('បន្ថែម') }}</span>
          </UButton>
          <UButton v-if="draft.id" color="gray" @click="reset">
            <span class="font-[Moul]">{{ $t('action.cancel') }}</span>
          </UButton>
        </div>
      </div>

      <div v-if="pending" class="h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />
      <div v-else-if="!rows.length" class="rounded-lg bg-white p-10 text-center shadow dark:bg-gray-800">
        <p class="text-gray-600 dark:text-gray-300">{{ tr('មិនទាន់មានប្រភេទសេវាបញ្ជូនទេ') }}</p>
      </div>

      <div v-else class="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <th class="px-4 py-3 font-semibold">{{ tr('ឈ្មោះ (ខ្មែរ)') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ឈ្មោះ (អង់គ្លេស)') }}</th>
              <th class="px-4 py-3 font-semibold">{{ tr('ស្ថានភាព') }}</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.id" class="border-b last:border-0 dark:border-gray-700"
              :class="r.isActive ? '' : 'opacity-60'">
              <td class="px-4 py-3 text-gray-800 dark:text-gray-100">{{ r.nameKh }}</td>
              <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ r.nameEn || '—' }}</td>
              <td class="px-4 py-3">
                <button class="rounded-full px-2.5 py-0.5 text-sm"
                  :class="r.isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'"
                  :disabled="readOnly" @click="toggleActive(r)">
                  {{ r.isActive ? tr('ដំណើការ') : tr('បិទដំណើការ') }}
                </button>
              </td>
              <td class="px-4 py-3 text-right">
                <div v-if="!readOnly" class="flex justify-end gap-2">
                  <UButton color="gray" size="sm" @click="edit(r)">
                    <TwFeather type="edit-2" :size="14" class="mr-1" />
                    <span class="font-[Moul]">{{ $t('action.edit') }}</span>
                  </UButton>
                  <UButton color="red" size="sm" @click="remove(r)">
                    <TwFeather type="trash-2" :size="14" class="mr-1" />
                    <span class="font-[Moul]">{{ $t('action.delete') }}</span>
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
