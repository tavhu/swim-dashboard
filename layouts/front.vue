<script setup lang="ts">
import { Html } from '#ui-colors/components';
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
const HTML :any = ref()

onMounted(()=>{
    HTML.value = document.querySelector('body')
    if (isDark.value) {
    HTML.value?.classList.add('bg-gray-500')
    HTML.value?.classList.remove('bg-gray-50')
  } else {
    HTML.value?.classList.remove('bg-gray-500')
    HTML.value?.classList.add('bg-gray-50')
  }
})


watch(isDark, () => {
  console.log(isDark)
  if (isDark.value) {
    HTML.value?.classList.add('bg-gray-500')
    HTML.value?.classList.remove('bg-gray-50')
  } else {
    HTML.value?.classList.remove('bg-gray-500')
    HTML.value?.classList.add('bg-gray-50')
  }
})

</script>

<template>
  <div id="dark-mode"  :class="isDark ? 'dark vt-dark' : ''">
    <TwToast position="top-right" :toasts="toasts" />
    <LayoutFloating />
    <div class="px-0 md:px-3 lg:px-4" >
      <slot />
    </div>
  </div>
</template>
