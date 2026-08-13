<script setup lang="ts">
import { useSidebarStore } from "~/store/sidebar";
import SidebarItem from "./SidebarItem.vue";

const sidebarStore = useSidebarStore();
</script>

<template>
  <ul class="space-y-0.5">
    <template v-for="sidebar in sidebarStore.items" :key="sidebar.name">
      <SidebarItem :item="sidebar" :level="1" class="font-[battambang] text-md font-semibold" />
    </template>
  </ul>
</template>
