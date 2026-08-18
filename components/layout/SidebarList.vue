<script setup lang="ts">
import { useSidebarStore } from "~/store/sidebar";
import SidebarItem from "./SidebarItem.vue";

const sidebarStore = useSidebarStore();

// Pruned rather than filtered per item: a group has to be hidden on the strength
// of its children, which the child cannot decide for itself.
const { prune } = useMenuPermission();
const items = computed(() => prune(sidebarStore.items as any));
</script>

<template>
  <ul class="space-y-0.5">
    <template v-for="sidebar in items" :key="sidebar.name">
      <SidebarItem :item="sidebar" :level="1" class="font-[battambang] text-md font-semibold" />
    </template>
  </ul>
</template>
