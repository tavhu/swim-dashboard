<script setup lang="ts">

import {  useThemeStore } from '~~/store/theme'

import { useToast, TwFeather, TwToast } from "vue3-tailwind";
const { toasts } = useToast();

// const cookieDark = useCookie('dark-mode')

const theme = useThemeStore()
const isDark = computed(()=>theme.isDark)
// console.log(theme.appTheme)
</script>

<template>
  <div id="dark-mode"  :class="isDark ? 'dark vt-dark' : ''">
    <NuxtLoadingIndicator />
    <TwToast position="top-right" :toasts="toasts" />
    <div>
      <LayoutFloating />
      <LayoutHeader />
      <div class="py-4 px-0 md:px-1  text-slate-900 dark:text-white  dark:bg-gray-900 bg-gray-100 ">
        <div class="flex min-h-screen text-slate-900 dark:text-white  dark:bg-gray-900 bg-gray-100  ">
          <div class="h-screen border-r-2 flex flex-col justify-between">
            <LayoutSidebar />
            <LayoutSidebar_bottom />  
          </div>
          <div class="w-full md:w-[calc(100%-8rem)] lg:w-[calc(100%-16rem)] sm:rounded-l-none">
            <div class="p-4 bg-gray-100 dark:bg-gray-900 h-full  font-[battambang]">
              <slot />
            </div>
          </div>
        </div>
        <!-- <div class="px-6 md:px-11">
          <div class="w-full bg-gray-900 shadow-xl bg-opacity-60 rounded-b-2xl h-4"></div>
        </div> -->
      </div>
      <!-- <div class="text-center flex items-center gap-1 justify-center text-gray-200">
        Developed with
        <TwFeather class="text-red-500" type="heart" /> By
        <a class="text-[#00c16a] " href="https://www.facebook.com/tavhu" target="_blank">
          Thona
        </a>
      </div> -->
    </div>
  </div>
</template>
