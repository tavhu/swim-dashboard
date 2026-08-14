<script setup lang="ts">
import { TwFeather, useToast } from "vue3-tailwind";

/**
 * ៥. សិទ្ធិអនុម័ត — the approval block every one of the six ទម្រង់ carries.
 *
 * One component rather than six copies. Each form stores the same fields
 * (approvalStatus, submittedAt/By, decidedAt/By, rejectionReason), so the only
 * thing that differs is which endpoint to call, passed in as `endpoint`.
 *
 * The officer submits (ស្នើសុំ); a centre director approves or rejects
 * (អនុម័ត / បដិសេធ). Whether the current user may decide is the caller's
 * judgement — it depends on the resource being approved — so it arrives as
 * `canDecide` rather than being guessed here.
 */
const props = defineProps<{
  /** Row being approved. */
  recordId: string;
  /** POST target taking { id, action, reason }. */
  endpoint: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
  submittedAt?: string | null;
  decidedAt?: string | null;
  rejectionReason?: string | null;
  submittedByName?: string | null;
  decidedByName?: string | null;
  canDecide?: boolean;
  readOnly?: boolean;
}>();

const emit = defineEmits<{ (e: "changed"): void }>();

const toast = useToast();
const busy = ref(false);
const showReject = ref(false);
const reason = ref("");

const STATUS = {
  DRAFT: { label: "ព្រាង", classes: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300" },
  SUBMITTED: { label: "បានស្នើសុំ", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  APPROVED: { label: "បានអនុម័ត", classes: "bg-primary/10 text-primary" },
  REJECTED: { label: "បានបដិសេធ", classes: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
} as const;

const current = computed(() => STATUS[props.status] ?? STATUS.DRAFT);

const fmt = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

async function act(action: "submit" | "approve" | "reject") {
  if (props.readOnly || busy.value) return;
  if (action === "reject" && !reason.value.trim()) {
    toast.error({ message: "សូមបញ្ជាក់មូលហេតុនៃការបដិសេធ" });
    return;
  }
  busy.value = true;
  try {
    await $fetch(props.endpoint, {
      method: "POST",
      body: { id: props.recordId, action, reason: reason.value.trim() || undefined },
    });
    toast.success({ message: "ជោគជ័យ" });
    showReject.value = false;
    reason.value = "";
    emit("changed");
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? "មិនជោគជ័យ" });
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="print-block col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
    <h3 class="text-xl font-[Moul] text-primary">សិទ្ធិអនុម័ត</h3>
    <hr class="my-2 border dark:border-gray-700" />

    <div class="flex flex-wrap items-center gap-x-8 gap-y-3">
      <div>
        <dt class="text-sm text-gray-500 dark:text-gray-400">ស្ថានភាព</dt>
        <dd class="mt-1">
          <span class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-base" :class="current.classes">
            <span class="h-2 w-2 rounded-full bg-current" />
            {{ current.label }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-sm text-gray-500 dark:text-gray-400">ស្នើឡើងដោយ</dt>
        <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
          {{ submittedByName || '—' }}<span v-if="submittedAt" class="text-gray-500"> · {{ fmt(submittedAt) }}</span>
        </dd>
      </div>
      <div>
        <dt class="text-sm text-gray-500 dark:text-gray-400">សម្រេចដោយ</dt>
        <dd class="mt-1 text-base text-gray-800 dark:text-gray-100">
          {{ decidedByName || '—' }}<span v-if="decidedAt" class="text-gray-500"> · {{ fmt(decidedAt) }}</span>
        </dd>
      </div>
    </div>

    <p v-if="status === 'REJECTED' && rejectionReason"
      class="mt-3 rounded-lg bg-red-50 p-3 text-base text-red-700 dark:bg-red-950/40 dark:text-red-300">
      មូលហេតុ៖ {{ rejectionReason }}
    </p>

    <!-- Controls are interface, not part of the printed record. -->
    <div v-if="!readOnly" class="no-print mt-4 flex flex-wrap gap-2">
      <UButton v-if="status === 'DRAFT' || status === 'REJECTED'" color="primary" :loading="busy"
        @click="act('submit')">
        <TwFeather type="send" :size="16" class="mr-1" />
        <span class="font-[Moul]">ស្នើសុំ</span>
      </UButton>

      <template v-if="canDecide && status === 'SUBMITTED'">
        <UButton color="primary" :loading="busy" @click="act('approve')">
          <TwFeather type="check" :size="16" class="mr-1" />
          <span class="font-[Moul]">អនុម័ត</span>
        </UButton>
        <UButton color="red" :loading="busy" @click="showReject = !showReject">
          <TwFeather type="x" :size="16" class="mr-1" />
          <span class="font-[Moul]">បដិសេធ</span>
        </UButton>
      </template>
    </div>

    <!-- A rejection without a reason tells the officer nothing, so it is required. -->
    <div v-if="showReject" class="no-print mt-3 flex flex-col gap-2 sm:flex-row">
      <input v-model="reason" type="text" placeholder="មូលហេតុនៃការបដិសេធ"
        class="w-full rounded-lg border border-gray-300 px-3 py-2 text-base dark:border-gray-700 dark:bg-gray-900" />
      <UButton color="red" :loading="busy" class="shrink-0" @click="act('reject')">
        <span class="font-[Moul]">បញ្ជាក់</span>
      </UButton>
    </div>
  </section>
</template>
