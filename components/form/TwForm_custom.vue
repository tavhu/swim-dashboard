<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import { computed, defineComponent, ref, watch } from "vue";
import UploadSvg from "../svg/TwUpload.vue";
import IconX from "../svg/TwX.vue";
// import FileIcon from "../svg/TwFile.vue"; // Add a generic file icon component

export interface Props {
  modelValue?: Array<string | File> | null;
  label?: string;
  multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  label: undefined,
  multiple: false,
});

const emit = defineEmits(["update:modelValue", "update:imageUrls"]);

const previews = ref<Array<{ url: string; name: string; isImage: boolean }>>([]);

const fileElement = ref<HTMLInputElement>();
const files = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

watch(files, (value) => {
  updatePreviews(value ?? []);
});

function handleInputFile() {
  if (!fileElement.value || !fileElement.value.files) return;
  handleChangeFile(fileElement.value.files);
}

function handleChangeFile(file: FileList) {
  let fileList;
  if (props.multiple) {
    fileList = Array.from(file).concat((files.value as Array<File>) ?? []);
  } else {
    fileList = Array.from(file);
  }
  files.value = fileList;
}

function updatePreviews(value: Array<string | File>) {
  if (!value) return;
  previews.value = Array.from(value).map((file) => {
    if (typeof file === "string") {
      return { url: file, name: "", isImage: false };
    } else if (file instanceof File) {
      const isImage = file.type.startsWith("image/");
      const url = isImage ? URL.createObjectURL(file) : "";
      return { url, name: file.name, isImage };
    } else {
      return { url: "", name: "", isImage: false };
    }
  });
}

function removeFile(index: number) {
  if (!files.value) return;
  files.value = Array.from(files.value).filter((_, i) => i !== index);
}

function removeAllFiles() {
  emit("update:modelValue", []);
  previews.value = [];
  files.value = [];
}
</script>
<template>
  <label v-if="label" class="font-bold text-gray-700 dark:text-gray-400">
    {{ label }}
  </label>
  <slot
    :previews="previews"
    :remove-file="removeFile"
    :remove-all-files="removeAllFiles"
    :handle-input-file="handleInputFile"
  >
    <div v-if="previews && previews.length > 0" class="mt-2">
      <div class="grid grid-cols-12 gap-4">
        <div
          v-for="(file, index) in previews"
          :key="`file-preview-${index}`"
          class="relative col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3"
        >
          <div class="border rounded bg-white shadow p-2 flex items-center space-x-2">
            <template v-if="file.isImage">
              <img :src="file.url" alt="preview" class="h-20 w-20 object-cover rounded" />
            </template>
            <template v-else>
              <!-- <FileIcon class="h-20 w-20 text-gray-500" /> -->
              <TwFeather type="file-text" class="h-20 w-20 text-gray-500"></TwFeather>
              <span class="text-sm break-all">{{ file.name }}</span>
            </template>
          </div>
          <div class="absolute top-2 right-2 cursor-pointer" @click="removeFile(index)">
            <IconX />
          </div>
        </div>
      </div>
      <button class="mt-2 text-sm text-red-500" @click="removeAllFiles">
        Remove All Files
      </button>
    </div>
    <div v-else>
      <label
        class="w-full px-4 py-6 bg-white border border-dashed rounded cursor-pointer flex flex-col items-center justify-center"
      >
        <UploadSvg class="mb-2" />
        <span class="text-gray-500 text-sm">Select or Drop Files Here</span>
        <input
          ref="fileElement"
          type="file"
          style="display: none"
          accept=""
          :multiple="props.multiple"
          @change="handleInputFile"
        />
      </label>
    </div>
  </slot>
</template>
