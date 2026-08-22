<script setup lang="ts">
import { mayStartForm } from "~~/shared/formPipeline";
import { useToast } from "vue3-tailwind";
import Datepicker from "@vuepic/vue-datepicker";

/**
 * ទម្រង់ទី៤ — សមាហរណកម្ម, create and edit.
 *
 * `?client=<id>` opens a new record for that client; `?id=<recordId>` edits one.
 *
 * Two repeating service lists and two separate uploads, which is what makes this
 * the largest of the forms so far. Both lists are the shared ServiceRowsField;
 * the difference is that services already delivered carry a លទ្ធផល and ones yet
 * to start do not.
 */
const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const readOnly = checkIfPageReadOnly();

const recordId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const client = ref<any>(null);
const services = ref<any[]>([]);

const { uploadFiles } = useFileUpload();
/** Chosen but not yet uploaded; one set per upload field. */
const goalFiles = ref<File[] | null>(null);
const communityFiles = ref<File[] | null>(null);

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  consultation: "",
  handoverDate: "",
  recipient: "",
  recipientPhone1: "",
  recipientPhone2: "",
  communeChiefName: "",
  communeChiefSex: "",
  communeChiefAge: "",
  communeChiefPhone: "",
  villageChiefName: "",
  villageChiefSex: "",
  villageChiefAge: "",
  villageChiefPhone: "",
  localOrganisation: "",
  goalAttachments: "",
  communityAttachments: "",
  monitorDate: "",
  monitorMethod: "",
  monitorResult: "",
  nextMonitorDate: "",
  conclusion: "",
});

const blankRow = () => ({ serviceId: "", startDate: "", endDate: "", outcome: "" });
const pastServices = ref<any[]>([blankRow()]);
const communityServices = ref<any[]>([blankRow()]);

/** អ្នកផ្តល់ព័តមាន is ជ្រើសរើសបានច្រើន, so checkboxes rather than a select. */
const informants = ref<string[]>([]);

/** Section ១, all derived from ទម្រង់ទី១. */
const clientAge = computed(() => ageFrom(client.value?.DOB));
const familyAddress = computed(() => {
  const c = client.value;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

useHead(() => ({ title: recordId.value ? "កែសម្រួលសមាហរណកម្ម" : "បង្កើតសមាហរណកម្ម" }));

onMounted(async () => {
  try {
    const opts: any = await $fetch("/api/client/service/options", { method: "POST" });
    services.value = opts?.services ?? [];

    if (recordId.value) {
      const rec: any = await $fetch("/api/client/reintegration/get", {
        method: "POST",
        body: { id: recordId.value },
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

      informants.value = String(rec.informants ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);

      const toRows = (list: any[]) =>
        list?.length
          ? list.map((r: any) => ({
              serviceId: r.serviceId ?? "",
              startDate: r.startDate ?? "",
              endDate: r.endDate ?? "",
              outcome: r.outcome ?? "",
            }))
          : [blankRow()];
      pastServices.value = toRows(rec.pastServices);
      communityServices.value = toRows(rec.communityServices);

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
      // client's own ទម្រង់ទី៤ page both hide the way here when it is not open
      // yet, but a typed or bookmarked URL reaches it directly — and the server
      // would refuse the save, which is a poor time to find out. Said before the
      // form is filled in rather than after.
      if (!mayStartForm(c.pipeline, 4)) {
        throw new Error(tr('ត្រូវបំពេញ និងស្នើសុំការអនុម័តទម្រង់មុនជាមុនសិន'));
      }
      // The family's number is already on ទម្រង់ទី១ and is the most likely first
      // contact for a client going home. Prefilled, and editable — the manual
      // asks for at least two lines and the second is nearly always someone else.
      form.recipientPhone1 = c.FOCTel || c.MOCTel || "";
    }
  } catch (e: any) {
    error.value = e?.message || t('message.loadFailed');
  } finally {
    pending.value = false;
  }
});

/** Upload one field's pending files and append them to its stored list. */
async function attach(field: "goalAttachments" | "communityAttachments", picked: Ref<File[] | null>) {
  if (!picked.value?.length) return;
  const uploaded = await uploadFiles(picked.value);
  if (uploaded) {
    const paths = Object.values(uploaded) as string[];
    const existing = String(form[field] ?? "").split(",").map((f) => f.trim()).filter(Boolean);
    form[field] = [...existing, ...paths].join(",");
  }
  picked.value = null;
}

async function submit() {
  if (readOnly || saving.value) return;
  if (!(await confirmDialog())) return;

  saving.value = true;
  try {
    // Upload first: a failure here must stop the save rather than store a record
    // whose documents silently went missing.
    await attach("goalAttachments", goalFiles);
    await attach("communityAttachments", communityFiles);

    const saved: any = await $fetch("/api/client/reintegration/upsert", {
      method: "POST",
      body: {
        ...form,
        informants: informants.value,
        pastServices: pastServices.value,
        communityServices: communityServices.value,
      },
    });
    toast.success({ message: t('message.saved') });
    router.push(`/client/reintegration/view/${saved.id}`);
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
          {{ recordId ? tr('កែសម្រួលសមាហរណកម្ម') : tr('បង្កើតសមាហរណកម្ម') }}
        </h2>
        <NuxtLink v-if="client" :to="`/client/reintegration/${client.id}`">
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

        <!-- ២. ស្ថានភាពបច្ចុប្បន្ន -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ស្ថានភាពបច្ចុប្បន្ន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <label class="block">
            <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('សេចក្តីពិគ្រោះយោបល់') }}</span>
            <textarea v-model="form.consultation" :disabled="readOnly" rows="3"
              class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
          </label>

          <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('សេវាកម្មដែលបានទទួលកន្លងមក') }}</h4>
          <hr class="my-2 border dark:border-gray-700" />
          <ServiceRowsField v-model="pastServices" :services="services" :outcomes="SERVICE_OUTCOME"
            :read-only="readOnly" add-:label="tr('បន្ថែមសេវាកម្ម')" />
        </section>

        <!-- ៣. គោលដៅ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('គោលដៅ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទទទួល') }}</span>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="form.handoverDate" :disabled="readOnly" :enableTimePicker="false"
                :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អ្នកទទួល') }}</span>
              <select v-model="form.recipient" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="r in RECIPIENT" :key="r" :value="r">{{ tr(r) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទូរស័ព្ទទំនាក់ទំនង ១') }}</span>
              <input v-model="form.recipientPhone1" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទូរស័ព្ទទំនាក់ទំនង ២') }}</span>
              <input v-model="form.recipientPhone2" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <h4 class="mt-6 text-lg font-[Moul] text-primary">{{ tr('អភិបាលកិច្ចសហគមន៍') }}</h4>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <label class="block 2xl:col-span-4">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ tr('ក. មេឃុំ ចៅសង្កាត់') }}</span>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះ') }}</span>
              <input v-model="form.communeChiefName" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ភេទ') }}</span>
              <select v-model="form.communeChiefSex" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="s in OFFICIAL_SEX" :key="s" :value="s">{{ tr(s) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អាយុ') }}</span>
              <input v-model="form.communeChiefAge" :disabled="readOnly" type="number" min="1" max="149"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទូរស័ព្ទទំនាក់ទំនង') }}</span>
              <input v-model="form.communeChiefPhone" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>

            <label class="block 2xl:col-span-4">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">{{ tr('ខ. មេភូមិ') }}</span>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ឈ្មោះ') }}</span>
              <input v-model="form.villageChiefName" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('ភេទ') }}</span>
              <select v-model="form.villageChiefSex" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="s in OFFICIAL_SEX" :key="s" :value="s">{{ tr(s) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អាយុ') }}</span>
              <input v-model="form.villageChiefAge" :disabled="readOnly" type="number" min="1" max="149"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លេខទូរស័ព្ទទំនាក់ទំនង') }}</span>
              <input v-model="form.villageChiefPhone" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>

            <label class="block 2xl:col-span-4">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('គ. អង្គភាព/អង្គការមូលដ្ឋាន') }}</span>
              <input v-model="form.localOrganisation" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <div class="mt-4">
            <AttachmentField v-model="form.goalAttachments" v-model:pending="goalFiles" :read-only="readOnly"
              :label="tr('កិច្ចសន្យា ការផ្តល់សេវាកម្មនៅសហគមន៍ និងឯកសារពាក់ព័ន្ធ')" />
          </div>
        </section>

        <!-- ៤. សេវាកម្មនៅសហគមន៍ត្រូវផ្តល់បន្ត -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('សេវាកម្មនៅសហគមន៍ត្រូវផ្តល់បន្ត') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <ServiceRowsField v-model="communityServices" :services="services" :read-only="readOnly"
            add-:label="tr('បន្ថែមសេវាកម្ម')" />
          <div class="mt-4">
            <AttachmentField v-model="form.communityAttachments" v-model:pending="communityFiles"
              :read-only="readOnly" :label="tr('កិច្ចសន្យា គ្រួសារ ឬអ្នកថែទាំបន្ត')" />
          </div>
        </section>

        <!-- ៥. ការតាមដាន និងវាយតម្លៃ -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ការតាមដាន និងវាយតម្លៃ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដាន') }}</span>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="form.monitorDate" :disabled="readOnly" :enableTimePicker="false" :close-on-auto-apply="false" autoApply format="dd/MM/yyyy"
                class="mt-1" />
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('កាលបរិច្ឆេទតាមដានបន្ត') }}</span>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="form.nextMonitorDate" :disabled="readOnly" :enableTimePicker="false"
                :close-on-auto-apply="false" autoApply format="dd/MM/yyyy" class="mt-1" />
            </label>

            <!-- ជ្រើសរើសបានច្រើន, so checkboxes rather than a select -->
            <div class="sm:col-span-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('អ្នកផ្តល់ព័តមាន (ជ្រើសរើសបានច្រើន)') }}</span>
              <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                <label v-for="i in INFORMANT" :key="i" class="flex items-center gap-2">
                  <input v-model="informants" :value="i" :disabled="readOnly" type="checkbox"
                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" />
                  <span class="text-base text-gray-800 dark:text-gray-100">{{ tr(i) }}</span>
                </label>
              </div>
            </div>

            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('វិធីសាស្រ្តតាមដាន') }}</span>
              <select v-model="form.monitorMethod" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="m in MONITOR_METHOD" :key="m" :value="m">{{ tr(m) }}</option>
              </select>
            </label>
            <label class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ tr('លទ្ធផល') }}</span>
              <select v-model="form.monitorResult" :disabled="readOnly"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900">
                <option value="">{{ $t('action.selectOne') }}</option>
                <option v-for="r in MONITOR_RESULT" :key="r" :value="r">{{ tr(r) }}</option>
              </select>
            </label>
          </div>
        </section>

        <!-- ៦. សិទ្ធិធ្វើសេចក្តីសន្និដ្ឋាន -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('សេចក្តីសន្និដ្ឋាន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <textarea v-model="form.conclusion" :disabled="readOnly" rows="5"
            class="w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ tr('ការស្នើសុំ និងការអនុម័ត ធ្វើនៅទំព័រមើលកំណត់ត្រា។') }}</p>
        </section>

        <div class="col-span-12 flex justify-end gap-2">
          <NuxtLink :to="client ? `/client/reintegration/${client.id}` : '/client'">
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
