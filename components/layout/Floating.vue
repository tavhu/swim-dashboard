<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import {  useThemeStore } from '~~/store/theme'

const theme = useThemeStore()
const toggleDark = ()=>{
  theme.toggle()
}
onBeforeMount(()=>{
  // const HTML = document.querySelector(':root')
  // HTML?.classList.remove('dark')
})
</script>
<template>

  <div class="fixed bottom-4 right-4 z-10">
    <button @click="toggleDark()" class="dark:text-gray-200 text-gray-700 bg-gray-300 dark:bg-gray-800 bg-opacity-75 rounded-full w-12 h-12 flex items-center justify-center ">
    <TwFeather :type="theme.isDark ? 'moon' : 'sun'"></TwFeather>
  </button>
  </div>
</template>
