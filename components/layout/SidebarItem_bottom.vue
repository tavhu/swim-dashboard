<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import { isOpen_bottom as currentOpen } from "~/store/isOpen_bottom";
import { useSidebarStore_bottom } from "~~/store/sidebar_bottom";
import { collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebaseDB } from "~/composables/firebase";
// import { isOpen as currentOpen } from '~~/store/isOpen'

const messNOtificationNumber = useState<number>('readMessages')

interface Item {
  isTitle: boolean
  name: string
  url?: string
  key?: string
  icon: string
  submenu: Array<Item>
}

interface Props {
  level: number,
  item: Item
}
defineProps<Props>();
const { type } = useBreakpoints()
const animationOpenClose = useAnimationOpenClose()
const sidebarStore = useSidebarStore_bottom()

const is = currentOpen()
const isOpen_bottom = ref(is.isOpen_bottom)
const toggleOpen = () => {
  is.toggleOpens()
  isOpen_bottom.value = is.isOpen_bottom
}
const permission = <any>useState('userPermission')

let unSub: Unsubscribe
let unreadItem: number
const items: any = ref([]);
onMounted(() => {
  const q = query(collection(firebaseDB, "message"), where("read", "==", false));
  unSub = onSnapshot(q, (querySnapshot) => {
    items.value = []
    querySnapshot.forEach((doc) => {
      items.value.push(doc.data().name);
    });
    // console.log("Current cities in CA: ", cities.join(", "));
    messNOtificationNumber.value++ //trigger global changes vallue
  });
})
</script>

<template>

  <li v-if="item.isTitle" :item="item">
    <div class="font-bold my-2 text-lg text-[#ffffff] hidden lg:block ">
      <!-- {{ item.name }} -->
    </div>
  </li>
  <li v-else-if="item.submenu.length === 0">
    <div :data-tooltip-show="type === 'md'" data-tooltip-pos="right" :aria-label="item.name">
      <NuxtLink :to="item.url" v-if="
        permission?.find((element: any) => { return element?.Resource?.frontEndURL == item.url?.replace('/', '').replaceAll('/', '-') && element?.granted || (element?.Resource?.frontEndURL == item.url?.replace('/', '').replaceAll('/', '-') && element?.read) || item.url === '/' })
      " class="border-l-2 ml-4 border-gray-300 flex md:justify-center lg:justify-start duration-300 items-center gap-3 cursor-pointer px-3 py-2  dark:hover:text-primary md:hover:text-gray-600 md:hover:bg-opacity-40 "
        :class="{
          'ml-[0.3rem] rounded-lg border-transparent ': level === 1
        }"
        :exact-active-class="level === 1 ? 'bg-primary bg-opacity-40 !md:hover:text-opacity-60 border-b-4 !border-gray-50 !border-opacity-50  font-bold' : ' border-l-2 border-primary font-bold  text-primary'"
        @click="sidebarStore.mobileOpen = false">
        <TwFeather v-if="item.icon" :type="item.icon"></TwFeather>
        <div class=" md:hidden lg:block select-none whitespace-nowrap overflow-hidden text-ellipsis">
          {{ item.name }}
        </div>
      </NuxtLink>
    </div>
  </li>
  <li v-else>
    <transition name="expand" @enter="animationOpenClose.animateEnter"
      @after-enter="animationOpenClose.animateAfterEnter" @leave="animationOpenClose.animateLeave">
      <ul class=" overflow-hidden duration-500" :class="{
        'mt-0': !isOpen_bottom
      }" v-show="isOpen_bottom">
        <template v-for="sub in item.submenu" :key="item.key">
          <SidebarItem_bottom class="ml-5 text-opacity-90 " :item="sub" :level="level + 1" />
        </template>
      </ul>
    </transition>
    <div :data-tooltip-show="type === 'md'" data-tooltip-pos="right" :aria-label="item.name" @click="toggleOpen">
      <div
        class="flex  md:justify-center lg:justify-start duration-300 items-center  gap-3 cursor-pointer px-5 py-3 dark:hover:text-primary md:hover:text-gray-600 md:hover:bg-opacity-40 border-transparent">
        <TwFeather v-if="item.icon" :type="item.icon"></TwFeather>
        <div class="md:hidden lg:block select-none whitespace-nowrap overflow-hidden text-ellipsis "
          :class="{ 'text-primary': isOpen_bottom }">
          {{ item.name }} <span v-if="item.name == 'ប្រអប់សារ' && items.length != 0"
            class="rounded-full text-xs bg-red-600 text-white text-center align-middle pl-1 pr-1"> {{ item.name ==
              'ប្រអប់សារ' ? items.length : '' }}</span>
        </div>
        <div class="md:hidden lg:flex ml-auto items-center">
          <TwFeather type="chevron-down" class="duration-300" :class="{ 'rotate-180 text-primary': isOpen_bottom }">
          </TwFeather>
        </div>
      </div>
    </div>
  </li>

</template>

<style>
.expand-enter-active,
.expand-leave-active {
  transition: all .4s ease-in-out;
  overflow: hidden;
}
</style>
