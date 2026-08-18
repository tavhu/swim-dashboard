<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import {
  GENDER, REASON_USE_DRUG, TYPE_DRUG_USED, LIVING_SITUATION, FUTURE_PLAN,
  label, yesNo, resolveAddress,
} from "~/composables/clientOptions";

const config = useRuntimeConfig();
const route = useRoute();
const { t } = useI18n();
const readOnly = checkIfPageReadOnly();

const client = ref<any>(null);
const pending = ref(true);
const error = ref<string | null>(null);

// Templates resolve names from setup scope, not from `window`.
const printPage = () => window.print();

const asset = (p?: string | null) =>
  p ? `${config.public.origin}/${String(p).replace(/^\/+/, "")}` : "";

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const val = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

const address = computed(() => {
  const c = client.value;
  if (!c) return { province: "—", district: "—", commune: "—", village: "—" };
  return resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
});

/** Field lists, in the order the intake form asks them. */
const personal = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("ភេទ"), value: label(GENDER, c.Gender) },
    { label: tr("ថ្ងៃខែឆ្នាំកំណើត"), value: fmtDate(c.DOB) },
    { label: tr("ទីកន្លែងកំណើត"), value: val(c.POB) },
    { label: tr("កម្រិតវប្បធម៌"), value: val(c.EducationLevel) },
    { label: tr("មុខរបរ"), value: val(c.Occupation) },
    { label: tr("កាលបរិច្ឆេទចូលមជ្ឈមណ្ឌល"), value: fmtDate(c.DateArrested) },
  ];
});

const addressFields = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("ផ្ទះលេខ"), value: val(c.homeBA) },
    { label: tr("ផ្លូវលេខ"), value: val(c.StreetBA) },
    { label: tr("រាជធានី/ខេត្ត"), value: address.value.province },
    { label: tr("ស្រុក-ខណ្ឌ"), value: address.value.district },
    { label: tr("ឃុំ/សង្កាត់"), value: address.value.commune },
    { label: tr("ភូមិ-ក្រុម"), value: address.value.village },
  ];
});

const family = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("ឈ្មោះឪពុក-អ្នកថែទាំ"), value: val(c.FatherOrChaperoneName) },
    { label: tr("ថ្ងៃខែឆ្នាំកំណើត"), value: fmtDate(c.FOCDOB) },
    { label: tr("អាពាហ៍ពិពាហ៍"), value: val(c.FOCMarried) },
    { label: tr("លេខទូរស័ព្ទ"), value: val(c.FOCTel) },
    { label: tr("អាសយដ្ឋាន"), value: val(c.FOCTelandAddress) },
    { label: tr("ឈ្មោះម្តាយ-អ្នកថែទាំ"), value: val(c.MotherOrChaperoneName) },
    { label: tr("ថ្ងៃខែឆ្នាំកំណើត"), value: fmtDate(c.MOCDOB) },
    { label: tr("អាពាហ៍ពិពាហ៍"), value: val(c.MOCMarried) },
    { label: tr("លេខទូរស័ព្ទ"), value: val(c.MOCTel) },
    { label: tr("អាសយដ្ឋាន"), value: val(c.MOCTelandAddress) },
    { label: tr("សមាជិកគ្រួសារដទៃទៀត"), value: val(c.OtherFamilyMembers), wide: true },
    { label: tr("មិត្តភក្ដិជិតស្និទ្ធ"), value: val(c.CloseFriend), wide: true },
  ];
});

const situation = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("អតិថិជនត្រូវបានបញ្ជូនដោយ"), value: val(c.ClientSendBy) },
    { label: tr("បញ្ហាប្រឈមដោយសំខាន់ៗ"), value: val(c.ImportantChallenge) },
    { label: tr("សកម្មភាពធ្លាប់បានប្រព្រឹត្ត"), value: val(c.PastActivities) },
    { label: tr("បរិស្ថាននៃការរស់នៅ"), value: label(LIVING_SITUATION, c.LivingSituation) },
  ];
});

const drugUse = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("ហេតុដែលនាំមានការប្រើប្រាស់"), value: label(REASON_USE_DRUG, c.ReasonUseDrug) },
    { label: tr("មូលហេតុផ្សេង"), value: val(c.ReasonUseDrugOther) },
    { label: tr("ប្រភេទគ្រឿងញៀន"), value: label(TYPE_DRUG_USED, c.typeDrugUsed) },
    { label: tr("ប្រភេទផ្សេង"), value: val(c.typeDrugUsedOther) },
    { label: tr("បរិមាណប្រើប្រាស់"), value: val(c.DrugVolumeUsed) },
    { label: tr("ភាពញឹកញាប់"), value: val(c.DrugRequecyUse) },
    { label: tr("រយៈពេលប្រើប្រាស់"), value: val(c.DrugDurationUse) },
    { label: tr("ដឹងថាខុសច្បាប់"), value: yesNo(c.KnownLegalConsequence, tr("ដឹង"), tr("មិនដឹង")) },
    { label: tr("ធ្លាប់ចូលមជ្ឈមណ្ឌលពីមុន"), value: yesNo(c.UsedtoRehab, tr("ធ្លាប់"), tr("មិនធ្លាប់")) },
    { label: tr("ចំនួនលើក"), value: val(c.HowManyTimeHaveServed) },
    { label: tr("មូលហេតុនៃការនាំចូល"), value: val(c.ReasonComingtoCenter), wide: true },
  ];
});

const inCentre = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("សកម្មភាពប្រចាំថ្ងៃ"), value: val(c.DailyActivitiesInCenter), wide: true },
    { label: tr("សកម្មភាពដែលចូលចិត្ត"), value: val(c.ActivitiesThatClientLike) },
    { label: tr("ទេពកោសល្យ"), value: val(c.ClientTalent) },
    { label: tr("ទំនាក់ទំនងជាមួយមិត្តភក្ដិ"), value: val(c.RelationshipWithFriends) },
    { label: tr("ទំនាក់ទំនងជាមួយបុគ្គលិក"), value: val(c.RelationshipWithStaff) },
    { label: tr("ទំនាក់ទំនងជាមួយគ្រូ"), value: val(c.RelationshipWithTeacher) },
    { label: tr("ទំនាក់ទំនងផ្សេងៗ"), value: val(c.RelationshipWithOther) },
  ];
});

const future = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("ការព្រួយបារម្ភ"), value: val(c.ConcernForClientFuture), wide: true },
    { label: tr("ក្តីសង្ឃឹម"), value: val(c.HopeForClientFuture), wide: true },
    { label: tr("ផែនការអនាគត"), value: label(FUTURE_PLAN, c.FuturePlanforClient) },
    { label: tr("លម្អិត"), value: val(c.FuturePlanforClientDetails) },
  ];
});

const interview = computed(() => {
  const c = client.value; if (!c) return [];
  return [
    { label: tr("កាលបរិច្ឆេទសម្ភាសន៍"), value: fmtDate(c.InterViewDate) },
    { label: tr("ឈ្មោះមន្ត្រីឬបុគ្គលិកសង្គមកិច្ច"), value: val(c.interviewerName) },
    { label: tr("តួនាទី"), value: val(c.InterviewerPosition) },
    { label: tr("យោបល់អ្នកសម្ភាសន៍"), value: val(c.InterviewerOpinoin), wide: true },
  ];
});

/** Only the checked entries are meaningful on a printed case file. */
const hopelessChecked = computed(() =>
  (client.value?.ClientHopelessMultiple ?? []).filter((h: any) => h.check)
);

const progress = computed(() => client.value?.ClientProgress ?? []);
const serveHistory = computed(() => client.value?.ClientServeHistory ?? []);

useHead(() => ({ title: client.value?.fullNameKH || tr("អតិថិជន") }));

/** Named so ApprovalPanel can reload the record after a decision. */
async function load() {
  try {
    client.value = await $fetch("/api/client/personalInformationGet", {
      method: "POST",
      body: { id: route.params.id },
    });
    if (!client.value?.id) error.value = t('message.clientNotFound');
  } catch (e: any) {
    error.value = e?.statusMessage || e?.message || t('message.loadFailed');
  } finally {
    pending.value = false;
  }
}
onMounted(load);
</script>

<template>
  <div class="font-[Battambang]">
  <!-- Same shell as the centre detail page: Moul headings in primary over an
       <hr>, Battambang body, white cards on the grey page, 12-column grid, and
       the shared print stylesheet in assets/css/main.css. -->

    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">{{ tr('សំណុំឯកសារអតិថិជន') }}</h2>
        <div class="no-print flex shrink-0 gap-2">
          <NuxtLink v-if="client" :to="`/client/register/${client.id}`">
            <UButton color="gray" size="xl" :disabled="readOnly">
              <TwFeather type="edit-2" :size="18" class="mr-1" />
              <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.edit') }}</span>
            </UButton>
          </NuxtLink>
          <UButton v-if="client" color="primary" size="xl" @click="printPage">
            <TwFeather type="printer" :size="18" class="mr-1" />
            <span class="hidden font-[Moul] text-lg sm:inline">{{ $t('action.print') }}</span>
          </UButton>
        </div>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <div v-if="pending" class="grid grid-cols-12 gap-4">
        <div v-for="n in 4" :key="n" class="col-span-12 h-40 animate-pulse rounded-lg bg-white shadow dark:bg-gray-800"
          :class="n === 1 ? 'xl:col-span-4' : 'xl:col-span-8'" />
      </div>

      <div v-else-if="error" class="rounded-lg bg-white p-8 text-center shadow dark:bg-gray-800">
        <p class="text-lg text-red-600 dark:text-red-400">{{ error }}</p>
        <NuxtLink to="/client">
          <UButton color="primary" class="mt-4"><span class="font-[Moul]">{{ $t('action.back') }}</span></UButton>
        </NuxtLink>
      </div>

      <div v-else-if="client" class="grid grid-cols-12 items-start gap-4">
        <!-- Identity -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 xl:col-span-4">
          <div class="flex flex-col items-center gap-3 text-center">
            <img v-if="client.photo" :src="asset(client.photo)" :alt="client.fullNameKH"
              class="h-28 w-28 rounded-full border border-[#1d152a7a] object-cover" />
            <div>
              <h3 class="text-lg leading-loose text-gray-800 dark:text-gray-100">{{ client.fullNameKH }}</h3>
              <p v-if="client.nickName" class="mt-1 text-base text-gray-500 dark:text-gray-400">
                {{ tr('ហៅ') }} {{ client.nickName }}
              </p>
            </div>
            <span class="rounded-full bg-primary/10 px-3 py-1 text-base text-primary">
              {{ client.ReadableCode }}
            </span>
            <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-base" :class="client.status
              ? 'bg-primary/10 text-primary'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'">
              <span class="h-2 w-2 rounded-full bg-current" />
              {{ client.status ? tr('ដំណើការ') : tr('បិទដំណើការ') }}
            </span>
          </div>
        </section>

        <!-- Personal -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 xl:col-span-8">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ព័ត៌មានផ្ទាល់ខ្លួន') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 2xl:grid-cols-3">
            <div v-for="f in personal" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 break-words text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Address -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('អាសយដ្ឋានកំណើត') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-2 gap-x-8 gap-y-4 lg:grid-cols-3 2xl:grid-cols-6">
            <div v-for="f in addressFields" :key="f.label">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ f.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- The remaining field groups share one shape. -->
        <section v-for="group in [
          { title: tr('ព័ត៌មានគ្រួសារ'), fields: family },
          { title: tr('ស្ថានភាពអតិថិជន'), fields: situation },
          { title: tr('ការប្រើប្រាស់គ្រឿងញៀន'), fields: drugUse },
          { title: tr('ជីវភាពក្នុងមជ្ឈមណ្ឌល'), fields: inCentre },
          { title: tr('អនាគតរបស់អតិថិជន'), fields: future },
          { title: tr('ការសម្ភាសន៍'), fields: interview },
        ]" :key="group.title"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ group.title }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div v-for="f in group.fields" :key="f.label" :class="(f as any).wide ? 'sm:col-span-2' : ''">
              <dt class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</dt>
              <dd class="mt-1 whitespace-pre-line break-words text-base leading-relaxed text-gray-800 dark:text-gray-100">
                {{ f.value }}
              </dd>
            </div>
          </dl>
        </section>

        <!-- Difficulties -->
        <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('បញ្ហាដែលអតិថិជនជួបប្រទះ') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <p class="mb-3 text-base text-gray-800 dark:text-gray-100">
            {{ yesNo(client.ClientFeelsHopless, tr('បាក់ទឹកចិត្ត'), tr('ធម្មតា')) }}
            <span v-if="client.ClientHoplessDetails" class="text-gray-500"> — {{ client.ClientHoplessDetails }}</span>
          </p>
          <ul v-if="hopelessChecked.length" class="list-inside list-disc space-y-1">
            <li v-for="h in hopelessChecked" :key="h.id" class="text-base text-gray-800 dark:text-gray-100">
              {{ h.label }}
            </li>
          </ul>
          <p v-else class="text-base text-gray-400">—</p>
        </section>

        <!-- Previous centres -->
        <section v-if="serveHistory.length"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800 2xl:col-span-6">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('ប្រវត្តិចូលមជ្ឈមណ្ឌល') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="overflow-x-auto">
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-3 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                  <th class="py-3 pr-4 font-normal">{{ tr('មជ្ឈមណ្ឌល ឬពន្ធនាគារ') }}</th>
                  <th class="py-3 font-normal">{{ tr('កាលបរិច្ឆេទ') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="(h, i) in serveHistory" :key="h.id">
                  <td class="py-3 pr-4 text-gray-500">{{ i + 1 }}</td>
                  <td class="py-3 pr-4 text-gray-800 dark:text-gray-100">{{ val(h.nameCenterorPrison) }}</td>
                  <td class="py-3 text-gray-800 dark:text-gray-100">{{ fmtDate(h.DateTimeServed) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Case notes -->
        <section v-if="progress.length"
          class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ tr('កំណត់ត្រាវឌ្ឍនភាព') }}</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <div class="overflow-x-auto">
            <table class="w-full text-left text-base">
              <thead class="border-b text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th class="py-3 pr-4 font-normal">{{ tr('ល.រ') }}</th>
                  <th class="py-3 pr-4 font-normal">{{ tr('កាលបរិច្ឆេទ') }}</th>
                  <th class="py-3 font-normal">{{ tr('លម្អិត') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="(p, i) in progress" :key="p.id">
                  <td class="py-3 pr-4 align-top text-gray-500">{{ i + 1 }}</td>
                  <td class="py-3 pr-4 align-top text-gray-800 dark:text-gray-100">{{ fmtDate(p.NoteDateTime) }}</td>
                  <td class="py-3 align-top leading-relaxed text-gray-800 dark:text-gray-100">{{ val(p.Details) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- The approval block every ទម្រង់ carries. ទម្រង់ទី១ had the columns and
             the CLIENT record type from the start but nothing to drive them, so
             the intake form was the one part of a case file that could not be
             signed off. Same shared panel as ទម្រង់ទី២-៦. -->
        <ApprovalPanel :record-id="client.id" endpoint="/api/client/approve" :status="client.approvalStatus"
          :submitted-at="client.submittedAt" :decided-at="client.decidedAt"
          :rejection-reason="client.rejectionReason"
          :submitted-by-name="client.submittedByName" :decided-by-name="client.decidedByName" :can-decide="true" :read-only="readOnly" @changed="load" />
      </div>
    </div>
  </div>
</template>
