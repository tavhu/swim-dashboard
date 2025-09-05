<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
const { data, status } = useAuth();
definePageMeta({ auth: true });

// const  ss = await useFetch('/api/me',{method :'post'})
// const headers = useRequestHeaders(["cookie"]) as HeadersInit;
// const { data: token } = await useFetch("/api/token", { headers });

useHead({
  title: "Dashboard",
});

// const rr = await useFetch('/api/deleteFile')
</script>

<template>
  <div>
    <!-- <NuxtLoadingIndicator /> -->
    <h1 class="text-2xl font-bold">Dashboard</h1>
    <hr class="my-2 border dark:border-gray-700" />
    <div class="grid grid-cols-12 gap-2">
       <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
        <div
          class="p-2 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between gap-2 h-full"
        >
          <div class="flex flex-col justify-between">
            <div class="text-gray-500 dark:text-gray-400 font-bold">
              គណនីសរុប
            </div>
            <div class="text-gray-700 dark:text-gray-200 font-bold text-lg">
              30
            </div>
          </div>
          <div
            class="bg-gradient-to-tl from-blue-600 to-blue-900 rounded-lg text-white p-2 flex items-center justify-center px-4"
          >
            <TwFeather type="lock"></TwFeather>
          </div>
        </div>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
        <div
          class="p-2 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between gap-2 h-full"
        >
          <div class="flex flex-col justify-between">
            <div class="text-gray-500 dark:text-gray-400 font-medium">
              អ្នកប្រើប្រាស់ថ្ងៃនេះ
            </div>
            <div class="text-gray-700 dark:text-gray-200 font-bold text-lg">
              150
              <span class="text-sm text-yellow-600">+3%</span>
            </div>
          </div>
          <div
            class="bg-gradient-to-tl from-green-600 to-green-900 rounded-lg text-white p-2 flex items-center justify-center px-4"
          >
            <TwFeather type="aperture"></TwFeather>
          </div>
        </div>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
        <div
          class="p-2 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between gap-2 h-full"
        >
          <div class="flex flex-col justify-between">
            <div class="text-gray-500 dark:text-gray-400 font-medium">
              ចំនួនអ្នកទទួលសេវា
            </div>
            <div class="text-gray-700 dark:text-gray-200 font-bold text-lg">
              +3,462
              <span class="text-sm text-red-600">+2%</span>
            </div>
          </div>
          <div
            class="bg-gradient-to-tl from-yellow-600 to-yellow-900 rounded-lg text-white p-2 flex items-center justify-center px-4"
          >
            <TwFeather type="users"></TwFeather>
          </div>
        </div>
      </div>
      <div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3">
        <div
          class="p-2 rounded-lg bg-white dark:bg-gray-800 shadow flex justify-between gap-2 h-full"
        >
          <div class="flex flex-col justify-between">
            <div class="text-gray-500 dark:text-gray-400 font-medium">
              មណ្ឌលសរុប
            </div>
            <div class="text-gray-700 dark:text-gray-200 font-bold text-lg">
              13
              <span class="text-sm text-yellow-600"></span>
            </div>
          </div>
          <div
            class="bg-gradient-to-tl from-gray-600 to-gray-900 rounded-lg text-white p-2 flex items-center justify-center px-4"
          >
            <TwFeather type="home"></TwFeather>
          </div>
        </div>
      </div> 
    </div>
    <div class="grid grid-cols-12 gap-2 mt-2">
      <div class="col-span-12 md:col-span-12">
        <div class="flex gap-2 rounded-lg p-4 shadow bg-white dark:bg-gray-800">
          <div class="flex flex-col justify-between">
           <DashboardChart/>
          </div>
        </div>
      </div>
    </div>
    <!-- <div class="grid grid-cols-12 gap-2 mt-2">
      <div class="col-span-12 md:col-span-7">
        <div class="flex gap-2 rounded-lg p-4 shadow bg-white dark:bg-gray-800">
          <div class="flex flex-col justify-between">
            <div class="">
              <div class="text-gray-500 dark:text-gray-400 font-medium">
                Built by developers
              </div>
              <div class="text-gray-700 dark:text-gray-200 font-bold text-xl">
                Nuxt 3 Admin Dashboard
              </div>
              <div class="">
                From colors, cards, typography to complex elements, you will
                find the full documentation.
              </div>
            </div>
            <div class="">Read More ...</div>
          </div>
          <div
            class="rounded-lg bg-gradient-to-tl from-gray-50 to-gray-200 dark:from-gray-700 flex items-center justify-center w-52 h-52"
          >
            <img
              class="w-32 h-32 rounded object-cover"
              src="/images/rocket.png"
              alt=""
            />
          </div>
        </div>
      </div>
      <div class="col-span-12 md:col-span-5">
        <div class="flex gap-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div class="flex flex-col justify-between">
            <div class="">
              <div class="text-gray-500 dark:text-gray-400 font-medium">
                Built by developers
              </div>
              <div class="text-gray-700 dark:text-gray-200 font-bold text-xl">
                Nuxt 3 Admin Dashboard
              </div>
              <div class="">
                From colors, cards, typography to complex elements, you will
                find the full documentation.
              </div>
            </div>
            <div class="">Read More ...</div>
          </div>
          <div
            class="rounded-lg bg-gradient-to-tl from-gray-50 to-gray-200 dark:from-gray-700 flex items-center justify-center w-52 h-52"
          >
            <img
              class="w-32 h-32 rounded object-cover"
              src="/images/rocket.png"
              alt=""
            />
          </div>
        </div>
      </div>
    </div>  -->
  </div>
</template>
