<script setup lang="ts">
import { computed } from 'vue';
import { TwOffcanvas } from 'vue3-tailwind';

const props = defineProps({
  modelValue: Boolean, // for v-model
  title: String,
  content: String,
});

const emit = defineEmits(['update:modelValue']);

// Local state for the canvas, synced with the parent's v-model
const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});
</script>

<template>
  <TwOffcanvas position="right" width="800px" v-model="show">
    <template #headerTitle>
      <span class="font-[Moul] text-primary">{{ title }}</span>
    </template>
    <div class="p-4 overflow-auto font-[battambang]">
      <p class="whitespace-pre-wrap break-words">{{ content }}</p>
    </div>
  </TwOffcanvas>
</template>
