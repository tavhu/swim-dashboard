<script setup lang="ts">
import { useToast } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * ទម្រង់ទី៥ — តាមដាន និងវាយតម្លៃស្ថានភាពអតិថិជន, create and edit.
 *
 * The manual opens with ជ្រើសរើស (២)ឬ(៣) ដើម្បីបំពេញទិន្នន័យ, so the first thing
 * the form asks is which kind of follow-up this visit was, and only that
 * section is then shown. The endpoint clears the other one on save, so
 * switching after filling something in cannot leave both stored.
 */
const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const readOnly = checkIfPageReadOnly();

const followUpId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const client = ref<any>(null);
const services = ref<any[]>([]);

const { uploadFiles } = useFileUpload();
const files = ref<File[] | null>(null);

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  stage: "IN_CENTRE",
  monitorDate: "",
  monitorMethod: "",
  nextMonitorDate: "",
  attachments: "",
  monitorResult: "",
  conclusion: "",
});

const blankRow = () => ({ serviceId: "", startDate: "", endDate: "", outcome: "" });
const serviceRows = ref<any[]>([blankRow()]);
const informants = ref<string[]>([]);

const inCentre = computed(() => form.stage === "IN_CENTRE");

/** Section ១, all derived from ទម្រង់ទី១. */
const clientAge = computed(() => ageFrom(client.value?.DOB));
const familyAddress = computed(() => {
  const c = client.value;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

useHead(() => ({ title: followUpId.value ? "កែសម្រួលការតាមដាន" : "បង្កើតការតាមដាន" }));

onMounted(async () => {
  try {
    const opts: any = await $fetch("/api/client/service/options", { method: "POST" });
    services.value = opts?.services ?? [];

    if (followUpId.value) {
      const rec: any = await $fetch("/api/client/follow-up/get", {
        method: "POST",
        body: { id: followUpId.value },
      });
      if (!rec?.id) throw new Error(t('message.recordNotFound'));
      // Dates arrive as ISO strings over JSON; the datepickers need Date
      // objects or the year overlay silently fails. See composables/reviveDates.ts.
      Object.assign(rec, reviveDates(rec));

      for (const k of Object.keys(form)) {
        if (k === "id") continue;
        form[k] = rec[k] ?? "";
      }
      form.id = rec.id;
      form.stage = rec.stage || "IN_CENTRE";

      informants.value = String(rec.informants ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
      serviceRows.value = rec.services?.length
        ? rec.services.map((r: any) => ({
            serviceId: r.serviceId ?? "",
            startDate: r.startDate ?? "",
            endDate: r.endDate ?? "",
            outcome: r.outcome ?? "",
          }))
        : [blankRow()];

      client.value = rec.client;
    } else {
      form.clientId = clientIdParam.value;
      const c: any = await $fetch("/api/client/personalInformationGet", {
        method: "POST",
        body: { id: clientIdParam.value },
      });
      if (!c?.id) throw new Error(t('message.clientNotFound'));
      client.value = c;
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
    // Upload first: a failure here must stop the save rather than store a record
    // whose documents silently went missing.
    if (files.value?.length) {
      const uploaded = await uploadFiles(files.value);
      if (uploaded) {
        const paths = Object.values(uploaded) as string[];
        const existing = String(form.attachments ?? "").split(",").map((f) => f.trim()).filter(Boolean);
        form.attachments = [...existing, ...paths].join(",");
      }
      files.value = null;
    }

    const saved: any = await $fetch("/api/client/follow-up/upsert", {
      method: "POST",
      body: { ...form, informants: informants.value, services: serviceRows.value },
    });
    toast.success({ message: t('message.saved') });
    router.push(`/client/follow-up/view/${saved.id}`);
  } catch (e: any) {
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
          {{ followUpId ? tr('កែសម្រួលការតាមដាន') : tr('បង្កើតការតាមដាន') }}
        </h2>
        <NuxtLink v-if="client" :to="`/client/follow-up/${client.id}`">
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
        <!-- ១. ព័ត៌មានអតិថិជន -->
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
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទូរស័ព្ទទំនាក់ទំនងគ្រួសារ') }}</dt>
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

        <!-- The manual's ជ្រើសរើស (២)ឬ(៣) — asked before anything else, because
             it decides which section the rest of the form is. -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ប្រភេទការតាមដាន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">{{ tr('ជ្រើសរើសមួយ ដើម្បីបំពេញទិន្នន័យ។') }}</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label v-for="s in FOLLOW_UP_STAGE" :key="s.value"
              class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
              :class="form.stage === s.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary dark:border-gray-700'">
              <input v-model="form.stage" :value="s.value" :disabled="readOnly" type="radio"
                class="mt-1 h-4 w-4 text-primary focus:ring-primary" />
              <span>
                <span class="block text-base text-gray-800 dark:text-gray-100">{{ tr(s.label) }}</span>
                <span class="block text-sm text-gray-500 dark:text-gray-400">{{ s.hint }}</span>
              </span>
            </label>
          </div>
        </section>

        <!-- Asked by both sections, so asked once. -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">
            {{ inCentre ? tr('ការអនុវត្តផែនការសកម្មភាពផ្តល់សេវាកម្ម') : tr('ក្រោយពេលធ្វើសមាហរណកម្មទៅសហគមន៍') }}
          </h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដាន') }}</span>
              <Datepicker :text-input="true" v-model="form.monitorDate" :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy"
                class="mt-1" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដានបន្ត') }}</span>
              <Datepicker :text-input="true" v-model="form.nextMonitorDate" :disabled="readOnly" :enableTimePicker="false"
                :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
            </label>
            <label class="block" :class="inCentre ? 'sm:col-span-2' : ''">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('វិធីសាស្រ្តតាមដាន') }}</span>
              <select v-model="form.monitorMethod" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="m in MONITOR_METHOD" :key="m" :value="m">{{ tr(m) }}</option>
              </select>
            </label>

            <!-- ៣ only: the visit's own result and who reported it -->
            <label v-if="!inCentre" class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លទ្ធផល') }}</span>
              <select v-model="form.monitorResult" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="r in MONITOR_RESULT" :key="r" :value="r">{{ tr(r) }}</option>
              </select>
            </label>
            <div v-if="!inCentre" class="sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អ្នកផ្តល់ព័តមាន (ជ្រើសរើសបានច្រើន)') }}</span>
              <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                <label v-for="i in INFORMANT" :key="i" class="flex items-center gap-2">
                  <input v-model="informants" :value="i" :disabled="readOnly" type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span class="text-base text-gray-800 dark:text-gray-100">{{ tr(i) }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- ២ only: the services being followed up, each with its own result -->
          <template v-if="inCentre">
            <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('សេវាកម្មដែលកំពុងតាមដាន') }}</h4>
            <hr class="my-2 border dark:border-gray-700" />
            <ServiceRowsField v-model="serviceRows" :services="services" :outcomes="FOLLOW_UP_SERVICE_OUTCOME"
              :read-only="readOnly" add-:label="tr('បន្ថែមសេវាកម្ម')" />
          </template>

          <div class="mt-4">
            <AttachmentField v-model="form.attachments" v-model:pending="files" :read-only="readOnly"
              :label="tr('ឯកសារពាក់ព័ន្ធ (បើមាន)')" />
          </div>
        </section>

        <!-- ៤. សិទ្ធិធ្វើសេចក្តីសន្និដ្ឋាន -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('សេចក្តីសន្និដ្ឋាន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <textarea v-model="form.conclusion" :disabled="readOnly" rows="5"
            class="w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('ការស្នើសុំ និងការអនុម័ត ធ្វើនៅទំព័រមើលកំណត់ត្រា។') }}</p>
        </section>

        <div class="col-span-12 flex justify-end gap-2">
          <NuxtLink :to="client ? `/client/follow-up/${client.id}` : '/client'">
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
