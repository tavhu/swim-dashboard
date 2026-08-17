<script setup lang="ts">
import { useToast } from "vue3-tailwind";

/**
 * ទម្រង់ទី៦ — បិទករណី, create and edit.
 *
 * The manual lists ក.សមាហរណកម្មជោគជ័យ and ខ.សមាហរណកម្មមិនជោគជ័យ one after the
 * other without saying to choose, but they contradict each other. An outcome
 * radio decides which group is asked, and the endpoint clears the other on
 * save — a decision taken with the user, not something the manual states.
 */
const route = useRoute();
const { t } = useI18n();
const router = useRouter();
const toast = useToast();
const readOnly = checkIfPageReadOnly();

const closureId = computed(() => (route.query.id as string) || "");
const clientIdParam = computed(() => (route.query.client as string) || "");

const pending = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const client = ref<any>(null);

const form = reactive<Record<string, any>>({
  id: "",
  clientId: "",
  outcome: "SUCCESSFUL",
  successReason: "",
  successReasonOther: "",
  centreStrengths: "",
  centreWeaknesses: "",
  centreVulnerabilities: "",
  communityStrengths: "",
  communityWeaknesses: "",
  communityVulnerabilities: "",
  futurePlan: "",
});

const failureReasons = ref<string[]>([]);

const successful = computed(() => form.outcome === "SUCCESSFUL");
const needsOtherText = computed(() => successful.value && form.successReason === CLOSURE_REASON_OTHER);

/** Section ១, all derived from ទម្រង់ទី១. */
const clientAge = computed(() => ageFrom(client.value?.DOB));
const familyAddress = computed(() => {
  const c = client.value;
  if (!c) return "—";
  const a = resolveAddress(c.cityProBA, c.districtBA, c.communeBA, c.villageBA);
  const parts = [a.village, a.commune, a.district, a.province].filter((p) => p && p !== "—");
  return parts.length ? parts.join(", ") : "—";
});

useHead(() => ({ title: closureId.value ? "កែសម្រួលការបិទករណី" : "បិទករណី" }));

onMounted(async () => {
  try {
    if (closureId.value) {
      const rec: any = await $fetch("/api/client/case-closure/get", {
        method: "POST",
        body: { id: closureId.value },
      });
      if (!rec?.id) throw new Error(t('message.recordNotFound'));

      for (const k of Object.keys(form)) {
        if (k === "id") continue;
        form[k] = rec[k] ?? "";
      }
      form.id = rec.id;
      form.outcome = rec.outcome || "SUCCESSFUL";
      failureReasons.value = String(rec.failureReasons ?? "")
        .split(",").map((s: string) => s.trim()).filter(Boolean);

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
    const saved: any = await $fetch("/api/client/case-closure/upsert", {
      method: "POST",
      body: { ...form, failureReasons: failureReasons.value },
    });
    toast.success({ message: t('message.saved') });
    router.push(`/client/case-closure/view/${saved.id}`);
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? t('message.notSaved') });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">{{ closureId ? 'កែសម្រួលការបិទករណី' : 'បិទករណី' }}</h2>
        <NuxtLink v-if="client" :to="`/client/case-closure/${client.id}`">
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
          <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានអតិថិជន</h3>
          <hr class="my-2 border dark:border-gray-700" />
          <dl class="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">លេខកូដអតិថិជន</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ client?.ReadableCode || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះអតិថិជន (ភេទ, អាយុ)</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ client?.fullNameKH || '—' }}
                <span v-if="client?.Gender || clientAge !== null" class="text-gray-500">
                  ({{ [client?.Gender, clientAge !== null ? clientAge + ' ឆ្នាំ' : null].filter(Boolean).join(', ') }})
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">លេខទូរស័ព្ទទំនាក់ទំនងគ្រួសារ</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
                {{ client?.FOCTel || client?.MOCTel || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-sm text-gray-500 dark:text-gray-400">អាសយដ្ឋានគ្រួសារ</dt>
              <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">{{ familyAddress }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">ព័ត៌មាននេះទាញពីទម្រង់ទី១ ដោយស្វ័យប្រវត្តិ។</p>
        </section>

        <!-- ២. មូលហេតុនៃការបិទករណី -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">មូលហេតុនៃការបិទករណី ឬបញ្ចេញពីមជ្ឈមណ្ឌល</h3>
          <hr class="my-2 border dark:border-gray-700" />

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label v-for="o in CLOSURE_OUTCOME" :key="o.value"
              class="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
              :class="form.outcome === o.value
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary dark:border-gray-700'">
              <input v-model="form.outcome" :value="o.value" :disabled="readOnly" type="radio"
                class="mt-1 h-4 w-4 text-primary focus:ring-primary" />
              <span>
                <span class="block text-base text-gray-800 dark:text-gray-100">{{ o.label }}</span>
                <span class="block text-sm text-gray-500 dark:text-gray-400">{{ o.hint }}</span>
              </span>
            </label>
          </div>

          <!-- ក — single choice -->
          <div v-if="successful" class="mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">មូលហេតុ (ជ្រើសរើសមួយ)</span>
            <div class="mt-2 space-y-2">
              <label v-for="r in CLOSURE_SUCCESS_REASON" :key="r" class="flex items-start gap-2">
                <input v-model="form.successReason" :value="r" :disabled="readOnly" type="radio"
                  class="mt-1 h-4 w-4 text-primary focus:ring-primary" />
                <span class="text-base text-gray-800 dark:text-gray-100">{{ r }}</span>
              </label>
            </div>
            <label v-if="needsOtherText" class="mt-3 block">
              <span class="text-sm text-gray-500 dark:text-gray-400">បញ្ជាក់</span>
              <input v-model="form.successReasonOther" :disabled="readOnly" type="text"
                class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <!-- ខ — multi -->
          <div v-else class="mt-4">
            <span class="text-sm text-gray-500 dark:text-gray-400">មូលហេតុ (ជ្រើសរើសបានច្រើន)</span>
            <div class="mt-2 space-y-2">
              <label v-for="r in CLOSURE_FAILURE_REASON" :key="r" class="flex items-start gap-2">
                <input v-model="failureReasons" :value="r" :disabled="readOnly" type="checkbox"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span class="text-base text-gray-800 dark:text-gray-100">{{ r }}</span>
              </label>
            </div>
          </div>
        </section>

        <!-- ៣. កំណត់សម្គាល់ — the manual's own words, guidance rather than a field -->
        <section class="col-span-12 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
          <h3 class="text-xl font-[Moul] text-primary">កំណត់សម្គាល់</h3>
          <p class="mt-2 text-base text-gray-700 dark:text-gray-200">{{ CLOSURE_STABILITY_NOTE.intro }}</p>
          <ul class="mt-2 list-inside list-disc space-y-1">
            <li v-for="(p, i) in CLOSURE_STABILITY_NOTE.points" :key="i"
              class="text-base leading-relaxed text-gray-700 dark:text-gray-200">
              {{ p }}
            </li>
          </ul>
        </section>

        <!-- ៤. សេចក្តីសង្ខេបសន្និដ្ឋាន -->
        <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">សេចក្តីសង្ខេបសន្និដ្ឋាន</h3>
          <hr class="my-2 border dark:border-gray-700" />

          <h4 class="text-lg font-[Moul] text-primary">ក. ករណីសិក្សាមណ្ឌល</h4>
          <div class="mt-2 grid grid-cols-1 gap-4 2xl:grid-cols-3">
            <label v-for="f in CLOSURE_SUMMARY_FIELDS" :key="`centre${f.key}`" class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</span>
              <textarea v-model="form[`centre${f.key}`]" :disabled="readOnly" rows="3"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <h4 class="mt-6 text-lg font-[Moul] text-primary">ខ. ករណីសិក្សានៅសហគមន៍</h4>
          <div class="mt-2 grid grid-cols-1 gap-4 2xl:grid-cols-3">
            <label v-for="f in CLOSURE_SUMMARY_FIELDS" :key="`community${f.key}`" class="block">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ f.label }}</span>
              <textarea v-model="form[`community${f.key}`]" :disabled="readOnly" rows="3"
                class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
            </label>
          </div>

          <label class="mt-6 block">
            <span class="text-sm text-gray-500 dark:text-gray-400">គ. គម្រោងអនាគតរបស់ជនរងគ្រោះគួទទួលបាន</span>
            <textarea v-model="form.futurePlan" :disabled="readOnly" rows="4"
              class="mt-1 w-full rounded border px-2 py-1 text-base dark:border-gray-700 dark:bg-gray-900" />
          </label>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            ការស្នើសុំ និងការអនុម័ត ធ្វើនៅទំព័រមើលកំណត់ត្រា។
          </p>
        </section>

        <div class="col-span-12 flex justify-end gap-2">
          <NuxtLink :to="client ? `/client/case-closure/${client.id}` : '/client'">
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
