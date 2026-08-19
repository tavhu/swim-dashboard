<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * ការបញ្ជូន — raising a referral for a client.
 *
 * Two blocks, as the ministry's notes set them out: why the referral is being
 * made and what is being asked for, then the consent and paperwork that has to
 * travel with it.
 *
 * Outside the ទម្រង់ទី១-៦ order rule on purpose. A referral can be needed at any
 * point in a case — often early, before much of the file exists — and holding it
 * behind a form the client has not reached would block the thing it is for.
 */
useHead({ title: tr("ការបញ្ជូន") });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();

const recordId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const client = ref<any>(null);
const serviceTypes = ref<any[]>([]);
const files = ref<File[]>([]);
const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  serviceTypeId: "",
  primaryReason: "",
  currentSituation: "",
  urgency: "ROUTINE",
  consentObtained: false,
  attachments: "",
  signature: "",
});

/**
 * Routine, urgent, emergency. Ordered as written rather than alphabetically —
 * it is a scale, and a scale out of order is harder to read than no order.
 */
const URGENCY = computed(() => [
  { value: "ROUTINE", label: tr("ធម្មតា") },
  { value: "URGENT", label: tr("បន្ទាន់") },
  { value: "EMERGENCY", label: tr("អាសន្ន") },
]);

/** The signature must be the signer's own name, as ទម្រង់ទី១'s is. */
const { data: token } = await useFetch("/api/token", {
  headers: useRequestHeaders(["cookie"]) as HeadersInit,
});
const signerName = computed(() => String((token.value as any)?.fullname ?? "").trim());
const normalise = (v: unknown) => String(v ?? "").trim().replace(/\s+/g, " ").toLowerCase();
const signatureValid = computed(
  () => !!signerName.value && normalise(form.signature) === normalise(signerName.value)
);
const signatureMismatch = computed(
  () => !!String(form.signature ?? "").trim() && !signatureValid.value
);

const load = async () => {
  pending.value = true;
  error.value = null;
  try {
    // activeOnly: a withdrawn type must not be offered on a new referral, but
    // still has to resolve on the old ones that name it.
    const types: any = await $fetch("/api/referral-type", { query: { activeOnly: "true" } });
    serviceTypes.value = types?.data ?? [];

    if (recordId.value) {
      const rec: any = await $fetch("/api/client/referral/get", {
        method: "POST",
        body: { id: recordId.value },
      });
      if (!rec?.id) throw new Error(t("message.recordNotFound"));
      Object.assign(form, {
        id: rec.id,
        clientId: rec.clientId,
        serviceTypeId: rec.serviceTypeId ?? "",
        primaryReason: rec.primaryReason ?? "",
        currentSituation: rec.currentSituation ?? "",
        urgency: rec.urgency ?? "ROUTINE",
        consentObtained: rec.consentObtained ?? false,
        attachments: rec.attachments ?? "",
        signature: rec.signature ?? "",
      });
      client.value = rec.client;
    } else {
      form.clientId = clientIdParam.value;
      const c: any = await $fetch("/api/client/personalInformationGet", {
        method: "POST",
        body: { id: clientIdParam.value },
      });
      if (!c?.id) throw new Error(t("message.clientNotFound"));
      client.value = c;
    }
  } catch (e: any) {
    error.value = apiErrorMessage(e, t("message.loadFailed"));
  } finally {
    pending.value = false;
  }
};
onMounted(load);

const { uploadFiles } = useFileUpload();

const save = async () => {
  if (readOnly.value || saving.value) return;

  // Named, and pointed at — the same treatment ទម្រង់ទី១ gives a failed save.
  const problems: { field: string; label: string }[] = [];
  if (!form.serviceTypeId) problems.push({ field: "serviceTypeId", label: tr("ប្រភេទសេវា/ជំនួយដែលស្នើសុំ") });
  if (!String(form.primaryReason ?? "").trim())
    problems.push({ field: "primaryReason", label: tr("មូលហេតុចម្បងនៃការបញ្ជូន") });
  if (!signatureValid.value) problems.push({ field: "signature", label: tr("ហត្ថលេខា") });

  if (problems.length) {
    toast.error({ message: t("message.fillIn", { fields: problems.map((p) => p.label).join(" / ") }) });
    await nextTick();
    markFieldErrors(problems.map((p) => p.field));
    return;
  }
  clearFieldErrors();

  if (!(await confirmDialog())) return;
  saving.value = true;
  try {
    if (files.value.length) {
      const uploaded = await uploadFiles(files.value);
      const existing = String(form.attachments || "").split(",").filter(Boolean);
      form.attachments = [...existing, ...uploaded].join(",");
      files.value = [];
    }
    const res: any = await $fetch("/api/client/referral/upsert", { method: "POST", body: { ...form } });
    toast.success({ message: t("message.saved") });
    router.push(`/client/referral/view/${res.id}`);
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-2xl font-[Moul] text-primary">
            {{ recordId ? tr('កែសម្រួលការបញ្ជូន') : tr('បង្កើតការបញ្ជូន') }}
          </h2>
          <p v-if="client" class="mt-1 text-base text-gray-500 dark:text-gray-400">
            {{ client.ReadableCode }} · {{ client.fullNameKH }}
          </p>
        </div>
        <NuxtLink :to="client ? `/client/referral/${client.id}` : '/referral'">
          <UButton color="gray" size="xl">
            <span class="font-[Moul] text-lg">{{ $t('action.back') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="h-64 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800" />

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/referral">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else class="grid grid-cols-12 gap-4">
        <!-- មូលហេតុនៃការបញ្ជូន និងព័ត៌មានលម្អិតអំពីសេវា -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">
            {{ tr('មូលហេតុនៃការបញ្ជូន និងព័ត៌មានលម្អិតអំពីសេវា') }}
          </h3>
          <hr class="my-2 border dark:border-gray-700" />

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-6" data-field="serviceTypeId">
              <label class="block font-bold text-gray-700 dark:text-gray-300">
                {{ tr('ប្រភេទសេវា/ជំនួយដែលស្នើសុំ') }}
              </label>
              <select
                v-model="form.serviceTypeId"
                :disabled="readOnly"
                required
                class="mt-2 w-full rounded-lg border border-gray-300 p-2.5 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">{{ tr('សូមជ្រើសរើស') }}</option>
                <option v-for="s in serviceTypes" :key="s.id" :value="s.id">{{ s.nameKh }}</option>
              </select>
              <!-- Nothing to choose from is a setup problem, not a user error,
                   so it says which page fixes it. -->
              <p v-if="!serviceTypes.length" class="mt-1 text-sm text-amber-700 dark:text-amber-300">
                {{ tr('មិនទាន់មានប្រភេទសេវាបញ្ជូន — សូមបន្ថែមនៅ ការកំណត់') }}
              </p>
            </div>

            <div class="col-span-12 lg:col-span-6">
              <label class="block font-bold text-gray-700 dark:text-gray-300">{{ tr('កម្រិតបន្ទាន់') }}</label>
              <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                <label v-for="u in URGENCY" :key="u.value" class="flex items-center gap-2">
                  <input v-model="form.urgency" type="radio" :value="u.value" :disabled="readOnly" />
                  <span>{{ u.label }}</span>
                </label>
              </div>
            </div>

            <div class="col-span-12" data-field="primaryReason">
              <label class="block font-bold text-gray-700 dark:text-gray-300">
                {{ tr('មូលហេតុចម្បងនៃការបញ្ជូន') }}
              </label>
              <textarea
                v-model="form.primaryReason"
                :disabled="readOnly"
                rows="3"
                required
                class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>

            <div class="col-span-12">
              <label class="block font-bold text-gray-700 dark:text-gray-300">
                {{ tr('ស្ថានភាពបច្ចុប្បន្ន និងសាវតាពាក់ព័ន្ធ') }}
              </label>
              <textarea
                v-model="form.currentSituation"
                :disabled="readOnly"
                rows="4"
                class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </section>

        <!-- ការយល់ព្រម និងឯកសារភ្ជាប់ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ការយល់ព្រម និងឯកសារភ្ជាប់') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />

          <label class="flex items-start gap-3">
            <input v-model="form.consentObtained" type="checkbox" :disabled="readOnly" class="mt-1 h-5 w-5 rounded" />
            <span>
              <span class="font-bold text-gray-700 dark:text-gray-300">{{ tr('បានទទួលការយល់ព្រមពីអតិថិជន') }}</span>
              <!-- Consent is a fact about the client, not a formality of the
                   form, so the box says what ticking it asserts. -->
              <span class="block text-sm text-gray-500 dark:text-gray-400">
                {{ tr('អតិថិជនបានយល់ព្រមឲ្យបញ្ជូន និងចែករំលែកព័ត៌មានពាក់ព័ន្ធ') }}
              </span>
            </span>
          </label>

          <div class="mt-4">
            <label class="block font-bold text-gray-700 dark:text-gray-300">{{ tr('ឯកសារភ្ជាប់') }}</label>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ tr('ឯកសារវាយតម្លៃ អត្តសញ្ញាណប័ណ្ណ ឬកំណត់ត្រាសុខភាព') }}
            </p>
            <AttachmentField v-model="form.attachments" v-model:pending="files" :read-only="readOnly" />
          </div>

          <div class="mt-4" data-field="signature" :class="{ 'field-invalid': signatureMismatch }">
            <label class="block font-bold text-gray-700 dark:text-gray-300">{{ tr('ហត្ថលេខា / សេចក្តីប្រកាស') }}</label>
            <input
              v-model="form.signature"
              type="text"
              :disabled="readOnly"
              required
              :placeholder="signerName || tr('ហត្ថលេខា')"
              class="mt-2 w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
            <p v-if="signatureMismatch" class="mt-1 text-sm text-red-600">
              {{ tr('ហត្ថលេខាត្រូវតែជាឈ្មោះពេញរបស់អ្នក') }}: {{ signerName }}
            </p>
            <p v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ tr('ការចុះហត្ថលេខាបញ្ជាក់ថាព័ត៌មានខាងលើត្រឹមត្រូវ') }}
            </p>
          </div>

          <div v-if="!readOnly" class="mt-5 flex gap-2">
            <UButton color="primary" size="xl" :loading="saving" @click="save">
              <TwFeather type="save" :size="18" class="mr-1" />
              <span class="font-[Moul] text-lg">{{ $t('action.save') }}</span>
            </UButton>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
