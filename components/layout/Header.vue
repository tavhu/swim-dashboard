<script setup lang="ts">
import { TwButton, TwDropdownMenu, TwFeather } from "vue3-tailwind";
import { useSidebarStore } from "~~/store/sidebar";

const sidebarStore = useSidebarStore();
const animationOpenClose = useAnimationOpenClose();
const { signOut } = useAuth()

const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: token } = await useFetch("/api/token", { headers }); 
const config = useRuntimeConfig()

// const logout = () => {
//   router.push("/login");
// };

</script>
<template>
  <header
    class="md:flex w-full text-[#00c16a] border-spacing-1 border-t-0 shadow-xl border-[#343434] dark:bg-gray-900 bg-white px-2 md:sticky md:top-0 z-20">
    <div class="h-14  md:h-20 flex justify-between  items-center w-full px-4">
      <div>
        <NuxtLink to="/" class="flex items-center align-middle font-[moul] gap-3 nowrap text-sm md:text-xl ">
          <img src="/Logo.png" alt="" class="w-10 h-10 md:h-[4.3rem] md:w-[4.3rem] rounded-full  ">
          <span class="dark:text-white text-blue-900 "> ប្រព័ន្ទគ្រប់គ្រង<span class="text-primary">សុខុមាលភាពសង្គម </span> </span> 
        </NuxtLink>
      </div>
      <button class="block md:hidden float-right" @click="sidebarStore.mobileOpen = !sidebarStore.mobileOpen">
        <div class="-rotate-90">
          <TwFeather type="bar-chart-2"></TwFeather>
        </div>
      </button>
    </div>
    <transition name="expand" @enter="animationOpenClose.animateEnter" @after-enter="animationOpenClose.animateAfterEnter"
      @leave="animationOpenClose.animateLeave">
      <div class="block md:hidden text-gray-800" v-show="sidebarStore.mobileOpen">
        <LayoutMobileNav />
      </div>
    </transition>
    <div class="h-14  md:h-20 flex items-center w-full justify-end px-4 md:px-10 gap-3 font-[battambang]">
      <div class="">
        <ClientOnly>
        <!-- TODO: Add searchbar -->
        {{ //@ts-ignore
        token?.fullname}}
        </ClientOnly>
      </div>
      <div class="">
        <TwDropdownMenu    align="right" width="48">
          <template #trigger>
            <button>
              <img class="w-10 h-10 rounded-full border border-[#1d152a7a]" :src=" //@ts-ignore
                token?.image ?  config.public.origin + '/' + token?.image : '/images/profile1.jpg'" alt="" />
            </button>
          </template>
          <template #content>            
            <NuxtLink  :to="`/register?id=` + 
             //@ts-ignore
             token?.sub" >
              <button
                class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition">
                <div class="flex gap-2 items-center">
                  <TwFeather type="user" />
                  <div class="">Profile</div>
                </div>
              </button>
            </NuxtLink>
            <TwButton @click="signOut({callbackUrl : '/'})" variant="none" icon="log-out"
              class="block w-full px-4 py-2 text-sm leading-5 text-gray-700 dark:text-gray-200 text-left hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-800 transition">
              Logout
            </TwButton>
          </template>
        </TwDropdownMenu>
      </div>
    </div>
  </header>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: all 0.4s ease-in-out;
  overflow: hidden;
}
</style>
