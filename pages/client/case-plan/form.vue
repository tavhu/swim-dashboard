<script setup lang="ts">
import { mayStartForm } from "~~/shared/formPipeline";
import { TwFeather, useToast } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * ទម្រង់ទី៣ — ផែនការករណីរបស់អតិថិជន, create and edit.
 *
 * `?client=<id>` opens a new plan for that client; `?id=<planId>` edits one.
 * Same query convention as ទម្រង់ទី២.
 *
 * Section ១ is shown but never edited or stored — it is read from the client
 * record through the relation, so it cannot drift from ទម្រង់ទី១.
 */
const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const readOnly = checkIfPageReadOnly();

const planId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const client = ref<any>(null);
const services = ref<any[]>([]);

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  providerName: "",
  socialWorkerName: "",
  socialWorkerPhone: "",
  referralReason: "",
  challenges: "",
  situationAssessment: "",
  monitorDate: "",
  monitorMethod: "",
  monitorResult: "",
  nextMonitorDate: "",
  conclusion: "",
});

/**
 * ក. សកម្មភាពសេវាកម្ម. The manual ends the list with អាចបន្ថែមច្រើនទៀត, so rows
 * are added and removed rather than fixed. One blank row to start with, because
 * a plan with no activities is not a plan and an empty table gives the user
 * nothing to type into.
 */
const blankActivity = () => ({ serviceId: "", startDate: "", endDate: "" });
const activities = ref<any[]>([blankActivity()]);
/** ខ. សេវាបញ្ចូនបន្ត — repeatable full referrals; options from the referral table. */
const referralTypes = ref<any[]>([]);
/** ខ. rows are full referrals; _pending holds files not yet uploaded. */
const blankReferral = () => ({
  referralTypeId: "", primaryReason: "", currentSituation: "", urgency: "ROUTINE",
  startDate: "", endDate: "", consentObtained: false, attachments: "", signature: "",
  _pending: [] as File[],
});
const referralServices = ref<any[]>([blankReferral()]);

// The signer's own name, for the per-referral signature check.
const { data: token } = await useFetch("/api/token", {
  headers: useRequestHeaders(["cookie"]) as HeadersInit,
});
const signerName = computed(() => String((token.value as any)?.fullname ?? "").trim());
const { uploadFiles } = useFileUpload();

/** Section ១, all derived from ទម្រង់ទី១. */
const clientAge = computed(() => ageFrom(client.value?.DOB));
const familyAddress = computed(() => {
  const c = client.value;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

useHead(() => ({ title: planId.value ? "កែសម្រួលផែនការករណី" : "បង្កើតផែនការករណី" }));

onMounted(async () => {
  try {
    // The activity rows pick from the same /service catalogue ទម្រង់ទី២ uses, so
    // there is no new reference data behind this form.
    const opts: any = await $fetch("/api/client/service/options", { method: "POST" });
    services.value = opts?.services ?? [];
    // ខ. draws from the Referral & Service Details table, a separate list.
    // Non-fatal: if it cannot be read, ខ. simply has no options — that must not
    // stop ក. and the rest of the plan from being filled in and saved.
    try {
      const refTypes: any = await $fetch("/api/referral-type", { query: { activeOnly: "true" } });
      referralTypes.value = refTypes?.data ?? [];
    } catch {
      referralTypes.value = [];
    }

    if (planId.value) {
      // $fetch, not useFetch — useFetch is setup-only and never fires here.
      const rec: any = await $fetch("/api/client/case-plan/get", {
        method: "POST",
        body: { id: planId.value },
      });
      if (!rec?.id) throw new Error("រកមិនឃើញផែនការនេះទេ");
      // Dates arrive as ISO strings over JSON; the datepickers need Date
      // objects or the year overlay silently fails. See composables/reviveDates.ts.
      Object.assign(rec, reviveDates(rec));
      Object.assign(form, {
        id: rec.id,
        clientId: rec.clientId,
        providerName: rec.providerName ?? "",
        socialWorkerName: rec.socialWorkerName ?? "",
        socialWorkerPhone: rec.socialWorkerPhone ?? "",
        referralReason: rec.referralReason ?? "",
        challenges: rec.challenges ?? "",
        situationAssessment: rec.situationAssessment ?? "",
        monitorDate: rec.monitorDate ?? "",
        monitorMethod: rec.monitorMethod ?? "",
        monitorResult: rec.monitorResult ?? "",
        nextMonitorDate: rec.nextMonitorDate ?? "",
        conclusion: rec.conclusion ?? "",
      });
      activities.value = rec.activities?.length
        ? rec.activities.map((a: any) => ({
            serviceId: a.serviceId ?? "",
            startDate: a.startDate ?? "",
            endDate: a.endDate ?? "",
          }))
        : [blankActivity()];
      referralServices.value = rec.referralServices?.length
        ? rec.referralServices.map((r: any) => ({
            referralTypeId: r.referralTypeId ?? "",
            primaryReason: r.primaryReason ?? "",
            currentSituation: r.currentSituation ?? "",
            urgency: r.urgency ?? "ROUTINE",
            startDate: r.startDate ?? "",
            endDate: r.endDate ?? "",
            consentObtained: r.consentObtained ?? false,
            attachments: r.attachments ?? "",
            signature: r.signature ?? "",
            _pending: [] as File[],
          }))
        : [blankReferral()];
      client.value = rec.client;
    } else {
      form.clientId = clientIdParam.value;
      const c: any = await $fetch("/api/client/personalInformationGet", {
        method: "POST",
        body: { id: clientIdParam.value },
      });
      if (!c?.id) throw new Error(t('message.clientNotFound'));
      client.value = c;

      // The order rule, at the last door into this form. The list menu and the
      // client's own ទម្រង់ទី៣ page both hide the way here when it is not open
      // yet, but a typed or bookmarked URL reaches it directly — and the server
      // would refuse the save, which is a poor time to find out. Said before the
      // form is filled in rather than after.
      if (!mayStartForm(c.pipeline, 3)) {
        throw new Error(tr('ត្រូវបំពេញ និងស្នើសុំការអនុម័តទម្រង់មុនជាមុនសិន'));
      }
      // Already on record from ទម្រង់ទី១ — the centre the client was registered
      // under and the officer who interviewed them. Prefilled rather than asked
      // again, but editable: a plan can name a different institution or worker.
      form.providerName = c.ServiceCenter?.nameKH ?? "";
      form.socialWorkerName = c.interviewerName ?? "";
      form.socialWorkerPhone = c.ServiceCenter?.phoneNumber ?? "";
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

  saving.value = true;
  try {
    // Upload each referral's attachments before saving; a row keeps its files on
    // _pending until here, then hands over comma-joined paths like the other
    // forms store them.
    const referrals = [];
    for (const r of referralServices.value) {
      const { _pending, ...rest } = r;
      if (_pending?.length) {
        const uploaded = await uploadFiles(_pending);
        const existing = String(rest.attachments || "").split(",").filter(Boolean);
        rest.attachments = [...existing, ...uploaded].join(",");
      }
      referrals.push(rest);
    }
    const saved: any = await $fetch("/api/client/case-plan/upsert", {
      method: "POST",
      body: { ...form, activities: activities.value, referralServices: referrals },
    });
    toast.success({ message: t('message.saved') });
    router.push(`/client/case-plan/view/${saved.id}`);
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
          {{ planId ? tr('កែសម្រួលផែនការករណី') : tr('បង្កើតផែនការករណី') }}
        </h2>
        <NuxtLink v-if="client" :to="`/client/case-plan/${client.id}`">
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
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ព័ត៌មានអតិថិជន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខកូដអតិថិជន') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ client?.ReadableCode || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះអតិថិជន (ភេទ, អាយុ)') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ client?.fullNameKH || '—' }}
                <span v-if="client?.Gender || clientAge !== null" class="text-gray-500">
                  ({{ [client?.Gender, clientAge !== null ? clientAge + ' ' + tr('ឆ្នាំ') : null].filter(Boolean).join(', ') }})
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទំនាក់ទំនងគ្រួសារ') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ client?.FOCTel || client?.MOCTel || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អាសយដ្ឋានគ្រួសារ') }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ familyAddress }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ tr('ព័ត៌មាននេះទាញពីទម្រង់ទី១ ដោយស្វ័យប្រវត្តិ។') }}</p>
        </section>

        <!-- ២. ផែនការ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ផែនការ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ស្ថាប័នទទួលផ្តល់សេវា') }}</span>
              <input v-model="form.providerName" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះបុគ្គលិកសង្គម') }}</span>
              <input v-model="form.socialWorkerName" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទំនាក់ទំនង ឬអ៊ីម៊ែល') }}</span>
              <input v-model="form.socialWorkerPhone" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block sm:col-span-2 2xl:col-span-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('មូលហេតុនៃការបញ្ជូនទទួលសេវា') }}</span>
              <textarea v-model="form.referralReason" :disabled="readOnly" rows="2"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block sm:col-span-2 2xl:col-span-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('បញ្ហាប្រឈម') }}</span>
              <textarea v-model="form.challenges" :disabled="readOnly" rows="2"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block sm:col-span-2 2xl:col-span-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ការវាយតម្លៃស្ថានភាពបច្ចុប្បន្ន') }}</span>
              <textarea v-model="form.situationAssessment" :disabled="readOnly" rows="3"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <!-- ក. សកម្មភាពសេវាកម្ម — repeatable -->
          <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('ក. សកម្មភាពសេវាកម្ម (ផ្អែកលើតម្រូវការអតិថិជន)') }}</h4>
          <hr class="my-2 border dark:border-gray-700" />
          <ServiceRowsField v-model="activities" :services="services" :read-only="readOnly" />

          <!-- ខ. សេវាបញ្ចូនបន្ត — repeatable, same control as ក. The two are
               separate blocks because they answer different questions: what this
               centre will do, and where the client is sent on to. -->
          <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('ខ. សេវាបញ្ចូនបន្ត') }}</h4>
          <hr class="my-2 border dark:border-gray-700" />
          <ClientCasePlanReferralField v-model="referralServices" :types="referralTypes" :signer-name="signerName" :read-only="readOnly" />
        </section>

        <!-- ៣. កាលបរិច្ឆេទតាមដាន ត្រួតពិនិត្យ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('កាលបរិច្ឆេទតាមដាន ត្រួតពិនិត្យ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដាន') }}</span>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="form.monitorDate" :disabled="readOnly" :enableTimePicker="false"
                :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដានបន្ត') }}</span>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="form.nextMonitorDate" :disabled="readOnly" :enableTimePicker="false"
                :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
            </label>
            <label class="block sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('វិធីសាស្រ្តតាមដាន') }}</span>
              <select v-model="form.monitorMethod" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="m in MONITOR_METHOD" :key="m" :value="m">{{ tr(m) }}</option>
              </select>
            </label>
            <label class="block sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លទ្ធផល') }}</span>
              <select v-model="form.monitorResult" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="r in MONITOR_RESULT" :key="r" :value="r">{{ tr(r) }}</option>
              </select>
            </label>
          </div>
        </section>

        <!-- ៤. សេចក្តីសន្និដ្ឋាន — the approval block itself is on the view page,
             where a director reads the plan before deciding on it -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('សេចក្តីសន្និដ្ឋាន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <textarea v-model="form.conclusion" :disabled="readOnly" rows="6"
            class="w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('ការស្នើសុំ និងការអនុម័ត ធ្វើនៅទំព័រមើលផែនការ។') }}</p>
        </section>

        <div class="col-span-12 flex justify-end gap-2">
          <NuxtLink :to="client ? `/client/case-plan/${client.id}` : '/client'">
            <UButton color="gray" size="xl" type="button">
              <span class="font-[Moul] text-lg">{{ $t('action.back') }}</span>
            </UButton>
          </NuxtLink>
          <UButton type="submit" color="primary" size="xl" :loading="saving" :disabled="readOnly">
            <span class="font-[Moul] text-lg">{{ $t('action.save') }}</span>
          </UButton>
        </div>
      </form>
    </div>
  </div>
</template>
