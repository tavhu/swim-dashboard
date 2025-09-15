<script setup lang="ts">
import { useSidebarStore_bottom } from "~/store/sidebar_bottom";
import SidebarItem_bottom from "./SidebarItem_bottom.vue";

const sidebarStore = useSidebarStore_bottom();

</script>
<template>
  <ul>
    <template v-for="sidebar in sidebarStore.items">
      <SidebarItem_bottom :item="sidebar" :level="1" class="font-[battambang] text-md font-semibold" />
    </template>
  </ul>
</template>
