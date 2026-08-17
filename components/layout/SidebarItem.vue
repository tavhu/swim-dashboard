<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";
import { useSidebarOpenStore } from "~/store/sidebarOpen";
import { useSidebarStore } from "~~/store/sidebar";
import { collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { firebaseDB } from "~/composables/firebase";

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
  // Path of the parent group, "" at the top level. See store/sidebarOpen.ts.
  parentKey?: string
}

const props = withDefaults(defineProps<Props>(), { parentKey: "" });

const animationOpenClose = useAnimationOpenClose()
const sidebarStore = useSidebarStore()
const route = useRoute()

const sidebarOpen = useSidebarOpenStore()
const nodeKey = computed(() => `${props.parentKey}/${props.item.name}`)

const { t, te } = useI18n()
/**
 * Menu labels come from store/data/sidebarItem*.ts. Entries carry an `i18nKey`;
 * the leftover starter-template ones do not, so they fall back to their literal
 * `name` rather than rendering a raw key at the user.
 */
const label = computed(() =>
  props.item.i18nKey && te(props.item.i18nKey) ? t(props.item.i18nKey) : props.item.name
)
const isOpen = computed(() => sidebarOpen.isOpen(nodeKey.value))
const toggleOpen = () => sidebarOpen.toggle(nodeKey.value)

// Keep the group you are actually inside expanded, so a reload on a child page
// doesn't hide the link that is currently active.
const containsRoute = (node: Item): boolean =>
  node.url === route.path || (node.submenu ?? []).some(containsRoute)

watch(
  () => route.path,
  () => {
    if (props.item.submenu.length > 0 && containsRoute(props.item)) {
      sidebarOpen.revealPath(nodeKey.value)
    }
  },
  { immediate: true }
)

const permission = <any>useState('userPermission')

// Nested levels are set in by padding rather than by a stack of left borders,
// which is what made the expanded menu look cluttered. Spelled out rather than
// built from `level` because Tailwind only keeps classes it can find as literal
// text in the source.
// Spelled out rather than built from `level` because Tailwind only keeps
// classes it can find as literal text in the source.
const INDENT: Record<number, string> = {
  2: 'pl-8',
  3: 'pl-12',
  4: 'pl-16',
}
const indent = computed(() => INDENT[props.level] ?? '')

let unSub: Unsubscribe
const items: any = ref([]);
onMounted(() => {
  const q = query(collection(firebaseDB, "message"), where("read", "==", false));
  unSub = onSnapshot(q, (querySnapshot) => {
    items.value = []
    querySnapshot.forEach((doc) => {
      items.value.push(doc.data().name);
    });
    messNOtificationNumber.value++ //trigger global changes vallue
  });
})
onBeforeUnmount(() => unSub?.())
</script>

<template>
  <li v-if="item.isTitle" :item="item" />

  <li v-else-if="item.submenu.length === 0">
    <div :aria-label="label">
      <NuxtLink :to="item.url" v-if="
        permission?.find((element: any) => { return element?.Resource?.frontEndURL == item.url?.replace('/', '').replaceAll('/', '-') && element?.granted || (element?.Resource?.frontEndURL == item.url?.replace('/', '').replaceAll('/', '-') && element?.read) || item.url === '/' })
      "
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        :class="indent"
        exact-active-class="!bg-primary/10 !text-primary font-semibold"
        @click="sidebarStore.mobileOpen = false">
        <TwFeather v-if="item.icon" :type="item.icon" :size="18" class="shrink-0" />
        <span v-else class="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
        <span class="select-none truncate">{{ label }}</span>
      </NuxtLink>
    </div>
  </li>

  <li v-else>
    <button type="button" :aria-label="label" :aria-expanded="isOpen"
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800"
      :class="[indent, isOpen ? 'text-primary' : 'text-gray-600 dark:text-gray-400']" @click="toggleOpen">
      <TwFeather v-if="item.icon" :type="item.icon" :size="18" class="shrink-0" />
      <span v-else class="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-40" />
      <span class="select-none truncate">{{ label }}</span>
      <span v-if="item.name == 'ប្រអប់សារ' && items.length != 0"
        class="rounded-full bg-red-600 px-1.5 text-[10px] leading-4 text-white">
        {{ items.length }}
      </span>
      <!-- Sized with TwFeather's own `size` prop: the component renders a
           fixed 24px SVG inside an `overflow: hidden` wrapper, so setting the
           box with Tailwind h-/w- classes crops the icon instead of scaling it. -->
      <TwFeather type="chevron-down" :size="16" class="ml-auto shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }" />
    </button>

    <transition name="expand" @enter="animationOpenClose.animateEnter"
      @after-enter="animationOpenClose.animateAfterEnter" @leave="animationOpenClose.animateLeave">
      <ul class="overflow-hidden" v-show="isOpen">
        <template v-for="sub in item.submenu" :key="sub.name">
          <SidebarItem :item="sub" :level="level + 1" :parent-key="nodeKey" />
        </template>
      </ul>
    </transition>
  </li>
</template>

<style>
.expand-enter-active,
.expand-leave-active {
  transition: all .3s ease-in-out;
  overflow: hidden;
}
</style>
