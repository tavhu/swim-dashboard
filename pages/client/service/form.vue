<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * ទម្រង់ទី២ — ការប្រើសេវាកម្មរបស់អតិថិជន, create and edit.
 *
 * `?client=<id>` opens a new episode for that client; `?id=<serviceId>` edits an
 * existing one. Query rather than nested dynamic segments, which the app already
 * does at /center?id=.
 *
 * Section 1 of the paper form is shown but never edited or stored — it is read
 * from the client record through the relation, so it cannot drift.
 */
const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const readOnly = checkIfPageReadOnly();
const { localisedName } = useLocalisedName();

const serviceId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const client = ref<any>(null);

const { uploadFiles } = useFileUpload();
/** Files chosen but not yet uploaded; AttachmentField owns the stored list. */
const files = ref<File[] | null>(null);

const options = ref<{ clientTypes: any[]; services: any[] }>({ clientTypes: [], services: [] });

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  clientTypeId: "",
  reason: "",
  attachments: "",
  diagnosisApprovedBy: "",
  conclusion: "",
  serviceDate: "",
  serviceId: "",
  providerName: "",
  providerLocation: "",
  providerAgent: "",
  providerPhone: "",
  currentStatus: "",
  followUpServiceId: "",
});

const CURRENT_STATUS = [
  { value: "មិនល្អ", label: "មិនល្អ" },
  { value: "ប្រសើរ", label: "ប្រសើរ" },
  { value: "ប្រក្រតីភាព", label: "ប្រក្រតីភាព" },
];

useHead(() => ({ title: serviceId.value ? "កែសម្រួលការប្រើសេវាកម្ម" : "ចុះឈ្មោះការប្រើសេវាកម្ម" }));

onMounted(async () => {
  try {
    options.value = await $fetch("/api/client/service/options", { method: "POST" });

    if (serviceId.value) {
      const rec: any = await $fetch("/api/client/service/get", {
        method: "POST",
        body: { id: serviceId.value },
      });
      if (!rec?.id) throw new Error(t('message.recordNotFound'));
      Object.assign(form, {
        id: rec.id,
        clientId: rec.clientId,
        clientTypeId: rec.clientTypeId ?? "",
        reason: rec.reason ?? "",
        attachments: rec.attachments ?? "",
        diagnosisApprovedBy: rec.diagnosisApprovedBy ?? "",
        conclusion: rec.conclusion ?? "",
        serviceDate: rec.serviceDate ?? "",
        serviceId: rec.serviceId ?? "",
        providerName: rec.providerName ?? "",
        providerLocation: rec.providerLocation ?? "",
        providerAgent: rec.providerAgent ?? "",
        providerPhone: rec.providerPhone ?? "",
        currentStatus: rec.currentStatus ?? "",
        followUpServiceId: rec.followUpServiceId ?? "",
      });
      client.value = rec.client;
    } else {
      form.clientId = clientIdParam.value;
      const c: any = await $fetch("/api/client/personalInformationGet", {
        method: "POST",
        body: { id: clientIdParam.value },
      });
      if (!c?.id) throw new Error(t('message.clientNotFound'));
      client.value = c;
      // These three are already on record from ទម្រង់ទី១ — the centre the client
      // was registered under and the officer who interviewed them. Prefilled
      // rather than asked again, but left editable: a service can be delivered
      // somewhere other than the registering centre.
      const centre = c.ServiceCenter;
      form.providerName = centre?.nameKH ?? "";
      form.providerLocation = [centre?.Address, centre?.Village, centre?.Commute, centre?.District, centre?.City]
        .filter(Boolean).join(", ");
      form.providerAgent = c.interviewerName ?? "";
      form.providerPhone = centre?.phoneNumber ?? "";
    }
  } catch (e: any) {
    error.value = e?.message || t('message.loadFailed');
  } finally {
    pending.value = false;
  }
});

async function submit() {
  if (readOnly || saving.value) return;
  if (!(await confirmDialog())) return;
  if (!form.clientId) {
    toast.error({ message: "រកមិនឃើញអតិថិជន" });
    return;
  }
  saving.value = true;
  try {
    // Upload first: a failure here must stop the save, not store a record whose
    // documents silently went missing.
    if (files.value?.length) {
      const uploaded = await uploadFiles(files.value);
      if (uploaded) {
        const paths = Object.values(uploaded) as string[];
        const existing = String(form.attachments ?? "").split(",").map((f) => f.trim()).filter(Boolean);
        form.attachments = [...existing, ...paths].join(",");
      }
      files.value = null;
    }
    const saved: any = await $fetch("/api/client/service/upsert", { method: "POST", body: { ...form } });
    toast.success({ message: t('message.saved') });
    router.push(`/client/service/view/${saved.id}`);
  } catch (e: any) {
    // Name what failed rather than reporting only that it did.
    toast.error({ message: apiErrorMessage(e, t('message.notSaved'))});
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">
          {{ serviceId ? 'កែសម្រួលការប្រើសេវាកម្ម' : 'ចុះឈ្មោះការប្រើសេវាកម្ម' }}
        </h2>
        <NuxtLink v-if="client" :to="`/client/service/${client.id}`">
          <UButton color="gray" size="xl">
            <span class="font-[Moul] text-lg">{{ $t('action.back') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <form v-else class="grid grid-cols-12 items-start gap-4" @submit.prevent="submit">
        <!-- ១. ព័ត៌មានអតិថិជន — read from the client record, never edited here -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានអតិថិជន</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">លេខកូដអតិថិជន</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ client?.ReadableCode || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះអតិថិជន</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ client?.fullNameKH || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">លេខទំនាក់ទំនងគ្រួសារ</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ client?.FOCTel || client?.MOCTel || '—' }}
              </dd>
            </div>
          </dl>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            ព័ត៌មាននេះទាញពីទម្រង់ទី១ ដោយស្វ័យប្រវត្តិ។
          </p>
        </section>

        <!-- ២. រោគឬសញ្ញាណវិនិច្ឆ័យ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានរោគឬសញ្ញាណវិនិច្ឆ័យ</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ប្រភេទអតិថិជន</span>
              <select v-model="form.clientTypeId" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="t in options.clientTypes" :key="t.id" :value="t.id">{{ localisedName(t) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">មូលហេតុ</span>
              <input v-model="form.reason" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">អនុម័តរោគវិនិច្ឆ័យដោយ</span>
              <input v-model="form.diagnosisApprovedBy" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">សន្និដ្ឋាន</span>
              <textarea v-model="form.conclusion" :disabled="readOnly" rows="3"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>

            <!-- Documents are uploaded on save, so a failed upload aborts the
                 whole save rather than leaving a record referring to nothing. -->
            <div class="sm:col-span-2">
              <AttachmentField v-model="form.attachments" v-model:pending="files" :read-only="readOnly" />
            </div>
          </div>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            ប្រវត្តិចូលមជ្ឈមណ្ឌល និងចំនួនលើក មាននៅក្នុងទម្រង់ទី១រួចហើយ។
          </p>
        </section>

        <!-- ៣. សេវាកម្មដែលត្រូវការប្រើ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានសេវាកម្មដែលត្រូវការប្រើ</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ថ្ងៃខែឆ្នាំមកទទួលសេវាកម្ម</span>
              <Datepicker v-model="form.serviceDate" :disabled="readOnly" :enableTimePicker="false"
                format="dd/MM/yyyy" autoApply class="mt-1" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">សេវាកម្ម</span>
              <select v-model="form.serviceId" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="s in options.services" :key="s.id" :value="s.id">{{ localisedName(s) }}</option>
              </select>
            </label>
          </div>
        </section>

        <!-- ៤. អ្នកផ្តល់សេវា -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">អ្នកផ្តល់សេវា និងស្ថានភាពអតិថិជនបច្ចុប្បន្ន</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះស្ថាប័នផ្តល់សេវា</span>
              <input v-model="form.providerName" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ទីតាំងផ្តល់សេវា</span>
              <input v-model="form.providerLocation" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះភ្នាក់ងារផ្តល់សេវា</span>
              <input v-model="form.providerAgent" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">លេខទំនាក់ទំនងអ្នកផ្តល់សេវា</span>
              <input v-model="form.providerPhone" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">ស្ថានភាពអតិថិជនបច្ចុប្បន្ន</span>
              <select v-model="form.currentStatus" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="s in CURRENT_STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">តម្រូវការសេវាបន្ត</span>
              <select v-model="form.followUpServiceId" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="s in options.services" :key="s.id" :value="s.id">{{ localisedName(s) }}</option>
              </select>
            </label>
          </div>
        </section>

        <!-- Approval is not offered until the record exists to approve. -->
        <section v-if="!serviceId" class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <p class="text-base text-gray-500 dark:text-gray-400">
            សិទ្ធិអនុម័តនឹងអាចប្រើបាន បន្ទាប់ពីរក្សាទុក។
          </p>
        </section>

        <div class="col-span-12 flex justify-end gap-2">
          <UButton type="submit" color="primary" size="xl" :loading="saving" :disabled="readOnly">
            <TwFeather type="save" :size="18" class="mr-1" />
            <span class="font-[Moul] text-lg">{{ $t('action.save') }}</span>
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>
