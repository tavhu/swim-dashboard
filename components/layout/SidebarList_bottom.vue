<script setup lang="ts">
import { useSidebarStore_bottom } from "~/store/sidebar_bottom";
import SidebarItem from "./SidebarItem.vue";

// Same item component as the main menu. This list used to have its own near
// copy whose only real difference was opening submenus upward, for when it was
// pinned to the bottom of the screen; it now sits in the normal flow, so both
// menus can expand the same way and stay consistent with the mobile view.
const sidebarStore = useSidebarStore_bottom();
</script>
<template>
  <ul class="space-y-0.5">
    <template v-for="sidebar in sidebarStore.items" :key="sidebar.name">
      <SidebarItem :item="sidebar" :level="1" class="font-[battambang] text-md font-semibold" />
    </template>
  </ul>
</template>
