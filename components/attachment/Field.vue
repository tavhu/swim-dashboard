<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ឯកសារពាក់ព័ន្ធ — attach one or more files to a form.
 *
 * Not TwFile: that component hardcodes `accept="image/png, image/gif,
 * image/jpeg"` and is built around previewing pictures, so a user could not
 * pick a PDF or a Word document at all — even though the server has always
 * accepted them and the field is labelled ឯកសារ, not រូបភាព. The forms attach
 * contracts, assessments and reports far more often than photographs.
 *
 * `modelValue` is the stored list: comma-separated paths, the way
 * CenterPlan.filePath and ClientService.attachments already store them.
 * Selected-but-not-yet-uploaded files come out through `v-model:pending`, which
 * the page hands to uploadFiles() on save — uploading here would orphan files
 * whenever the user abandons the form.
 */
const props = withDefaults(
  defineProps<{
    /** Comma-separated stored paths. */
    modelValue?: string | null;
    /** Files chosen this session, not yet uploaded. */
    pending?: File[] | null;
    label?: string;
    hint?: string;
    readOnly?: boolean;
  }>(),
  { modelValue: "", pending: null, label: "ឯកសារពាក់ព័ន្ធ", hint: "", readOnly: false }
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "update:pending", v: File[] | null): void;
}>();

const inputId = `attach-${Math.random().toString(36).slice(2, 9)}`;
const dragging = ref(false);

const stored = computed(() =>
  String(props.modelValue ?? "").split(",").map((f) => f.trim()).filter(Boolean)
);
const chosen = computed(() => props.pending ?? []);

const fileName = (path: string) => path.split("/").pop() || path;

/** Rough type badge, from the extension the server assigned. */
const kindOf = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return { icon: "image", label: ext.toUpperCase() };
  if (ext === "pdf") return { icon: "file-text", label: "PDF" };
  if (["doc", "docx"].includes(ext)) return { icon: "file-text", label: ext.toUpperCase() };
  if (["xls", "xlsx"].includes(ext)) return { icon: "grid", label: ext.toUpperCase() };
  return { icon: "file", label: ext.toUpperCase() || "FILE" };
};

const humanSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/** Adding rather than replacing: picking a second time should not lose the first pick. */
function addFiles(list: FileList | File[] | null) {
  if (!list || props.readOnly) return;
  const incoming = Array.from(list);
  if (!incoming.length) return;
  const merged = [...chosen.value];
  for (const f of incoming) {
    // Same name and size twice over is the user picking the same file again.
    if (!merged.some((m) => m.name === f.name && m.size === f.size)) merged.push(f);
  }
  emit("update:pending", merged);
}

const onPick = (e: Event) => {
  const input = e.target as HTMLInputElement;
  addFiles(input.files);
  // Clear it so choosing the same file again still fires a change event.
  input.value = "";
};

const onDrop = (e: DragEvent) => {
  dragging.value = false;
  addFiles(e.dataTransfer?.files ?? null);
};

const removeChosen = (i: number) => {
  const next = [...chosen.value];
  next.splice(i, 1);
  emit("update:pending", next.length ? next : null);
};

const removeStored = (path: string) => {
  emit("update:modelValue", stored.value.filter((p) => p !== path).join(","));
};

const tooMany = computed(() => stored.value.length + chosen.value.length > MAX_UPLOAD_FILES);
const oversized = computed(() => chosen.value.filter((f) => f.size > MAX_UPLOAD_MB * 1024 * 1024));
</script>

<template>
  <div>
    <span v-if="label" class="text-sm text-gray-500 dark:text-gray-400">{{ label }}</span>

    <!-- Already stored -->
    <ul v-if="stored.length" class="mt-2 space-y-1">
      <li v-for="path in stored" :key="path"
        class="flex items-center gap-2 rounded border px-2 py-1 text-sm dark:border-gray-700">
        <TwFeather :type="kindOf(path).icon" :size="16" class="shrink-0 text-gray-400" />
        <a :href="`/${path}`" target="_blank" rel="noopener"
          class="min-w-0 flex-1 truncate text-primary hover:underline">{{ fileName(path) }}</a>
        <span class="shrink-0 text-xs text-gray-400">{{ kindOf(path).label }}</span>
        <button v-if="!readOnly" type="button" class="shrink-0 text-red-600 hover:underline"
          @click="removeStored(path)">លុប</button>
      </li>
    </ul>

    <!-- Chosen this session -->
    <ul v-if="chosen.length" class="mt-2 space-y-1">
      <li v-for="(f, i) in chosen" :key="`${f.name}-${f.size}-${i}`"
        class="flex items-center gap-2 rounded border border-dashed px-2 py-1 text-sm dark:border-gray-700">
        <TwFeather :type="kindOf(f.name).icon" :size="16" class="shrink-0 text-gray-400" />
        <span class="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-200">{{ f.name }}</span>
        <span class="shrink-0 text-xs" :class="f.size > MAX_UPLOAD_MB * 1024 * 1024 ? 'text-red-600' : 'text-gray-400'">
          {{ humanSize(f.size) }}
        </span>
        <button v-if="!readOnly" type="button" class="shrink-0 text-red-600 hover:underline"
          @click="removeChosen(i)">លុប</button>
      </li>
    </ul>

    <!-- Picker -->
    <div v-if="!readOnly" class="mt-2">
      <input :id="inputId" type="file" multiple :accept="ACCEPTED_UPLOAD_MIME" class="sr-only" @change="onPick" />
      <label :for="inputId"
        class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors"
        :class="dragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary dark:border-gray-700'"
        @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="onDrop">
        <TwFeather type="upload-cloud" :size="24" class="text-gray-400" />
        <span class="mt-2 text-sm text-gray-600 dark:text-gray-300">ជ្រើសរើស ឬទម្លាក់ឯកសារនៅទីនេះ</span>
        <span class="mt-1 text-xs text-gray-400">
          {{ ACCEPTED_UPLOAD_LABEL }} · អតិបរមា {{ MAX_UPLOAD_MB }}MB ក្នុងមួយឯកសារ
        </span>
      </label>
      <p v-if="hint" class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ hint }}</p>
      <!-- Said before saving rather than after the endpoint refuses it. -->
      <p v-if="tooMany" class="mt-1 text-xs text-red-600">
        ឯកសារច្រើនពេក — អតិបរមា {{ MAX_UPLOAD_FILES }} ក្នុងមួយលើក។
      </p>
      <p v-if="oversized.length" class="mt-1 text-xs text-red-600">
        ឯកសារធំពេក៖ {{ oversized.map((f) => f.name).join(", ") }}
      </p>
    </div>
  </div>
</template>
