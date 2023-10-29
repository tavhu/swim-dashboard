<script setup lang="ts">
import { useToast,TwToast } from 'vue3-tailwind';
import {useThemeStore} from '~~/store/theme'

useHead({
  htmlAttrs: {
    lang: 'en',
  }
})

const { toasts } = useToast();

const theme = useThemeStore()
const isDark = computed(()=>theme.isDark)
</script>

<template>
  <div id="dark-mode"  :class="isDark ? 'dark vt-dark' : ''">
    <TwToast position="top-right" :toasts="toasts" />
    <LayoutFloating />
    <div class="px-0 md:px-3 lg:px-4">
      <slot />
    </div>
  </div>
</template>
