<script setup lang="ts">
import {
    useToast,
    TwButton,
    TwErrorMessage,
    useForm,
    TwFile,
    TwForm,
    TwInput,
    vClean,
    useConfig,
} from "vue3-tailwind";
import {
    ref,
    watch,
    onMounted,
    computed,
    useAttrs,
    getCurrentInstance,
} from "vue";
import { defu } from "defu";

const props = defineProps<{
    modelValue ? : any;
    multiple ? : boolean;
    label ? : string;
}>();

const emit = defineEmits(["update:modelValue"]);

const {
    viewer
} = useConfig();
const toast = useToast();
const fileElement = ref < HTMLInputElement | null > (null);
const previews = ref < {
    url: string;
    name: string;
    isImage: boolean
} [] > ([]);
const files = ref < Array < File | string > > ([]);
const attrs = useAttrs();
const instance = getCurrentInstance();

const inputId = computed(
    () => `TwFile_${instance?.uid ?? Math.floor(Math.random() * 1000)}`
);

onMounted(() => {
    if (props.modelValue) {
        files.value = props.multiple ?
            (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]) :
            (Array.isArray(props.modelValue) ? [props.modelValue[0]] : [props.modelValue]);
    }
});

watch(
    files,
    (value) => {
        emit("update:modelValue", value);
        updatePreviews(value);
    }, {
        deep: true,
        immediate: true
    }
);

function handleInputFile() {
    if (!fileElement.value || !fileElement.value.files) return;
    handleChangeFile(fileElement.value.files);
}

function handleChangeFile(file: FileList) {
    let fileList;
    if (props.multiple) {
        fileList = Array.from(file).concat((files.value as Array < File > ) ?? []);
    } else {
        fileList = Array.from(file);
    }
    files.value = fileList;
}

function updatePreviews(value: Array < string | File > ) {
    if (!value) return;
    previews.value = Array.from(value).map((file) => {
        if (typeof file === "string") {
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file);
            return {
                url: file,
                name: file.split('/').pop() ?? '',
                isImage: isImage
            };
        } else if (file instanceof File) {
            const isImage = file.type.startsWith("image/");
            const url = isImage ? URL.createObjectURL(file) : "";
            return {
                url,
                name: file.name,
                isImage
            };
        } else {
            return {
                url: "",
                name: "",
                isImage: false
            };
        }
    });
}

function remove(index: number) {
    files.value.splice(index, 1);
}

const componentAttrs = computed(() => {
    return {
        ...attrs,
        ...{
            class: "flex flex-col gap-2"
        },
    };
});
const config = useConfig();
</script>
<template>
<div v-bind="componentAttrs">
  <label v-if="props.label" class="text-sm dark:text-gray-200" :for="inputId">
    {{ props.label }}
  </label>
  <div class="flex gap-2 items-center flex-wrap">
    <div class="relative group" v-for="(preview, index) in previews" :key="index">
      <div v-if="preview.isImage">
        <img class="w-20 h-20 rounded-md object-cover" :src="preview.url.includes('blob:') ? preview.url : config.public.origin + '/' + preview.url" alt="" />
      </div>
      <div v-else class="w-20 h-20 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div class="text-xs text-center text-gray-500 dark:text-gray-400 p-1 break-all">{{ preview.name }}</div>
      </div>
      <div @click="remove(index)" class="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-1 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    <div class="flex items-center justify-center">
      <label :for="inputId" class="flex flex-col items-center justify-center w-20 h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
        <div class="flex flex-col items-center justify-center pt-5 pb-6">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <input :id="inputId" @input="handleInputFile" ref="fileElement" type="file" class="hidden" :multiple="props.multiple" />
      </label>
    </div>
  </div>
</div>
</template>