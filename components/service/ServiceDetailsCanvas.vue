<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { TwOffcanvas } from 'vue3-tailwind';

const props = defineProps({
  openisTrue: Boolean,
  title: String,
  content: String,
});

const offcanvas = ref<any>(null);

onMounted(() => {
  if (props.openisTrue) {
    offcanvas.value?.openOffCanvas();
  }
});
</script>

<template>
  <TwOffcanvas ref="offcanvas" position="right" width="800px">
    <template #headerTitle>
      <span class="font-[Moul] text-primary">{{ title }}</span>
    </template>
    <div class="p-4 overflow-auto font-[battambang]">
      <p class="whitespace-pre-wrap break-words">{{ content }}</p>
    </div>
  </TwOffcanvas>
</template>
