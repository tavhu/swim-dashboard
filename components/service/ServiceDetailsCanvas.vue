<script setup lang="ts">
import { ref } from 'vue';
import { TwOffcanvas } from 'vue3-tailwind';

// Props to accept the title and content for the canvas
const props = defineProps({
  data: {
    type: Object,
    default: () => ({ title: '', content: '' }),
  },
});

// Create a ref for the canvas component
const canvasRef = ref<InstanceType<typeof TwOffcanvas> | null>(null);

// Define a method to open the canvas, which will be called from the parent page
const open = () => {
  canvasRef.value?.open();
};

// Expose the `open` method so the parent component can call it
defineExpose({ open });
</script>

<template>
  <TwOffcanvas position="right" width="800px" ref="canvasRef">
    <template #headerTitle>
      <span class="font-[Moul] text-primary">{{ data.title || 'ព័ត៌មានលម្អិត' }}</span>
    </template>
    <div class="p-4 overflow-auto font-[battambang]">
      <p class="whitespace-pre-wrap break-words">{{ data.content || 'N/A' }}</p>
    </div>
  </TwOffcanvas>
</template>
