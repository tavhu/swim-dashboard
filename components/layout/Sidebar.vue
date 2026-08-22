<script setup lang="ts">
</script>

<template>
  <!--
    One scrolling column, not two fixed layers. The main menu and the bottom
    (Settings) menu used to be positioned independently of each other, so a
    tall menu rendered straight through the one below it. Here the bottom block
    is pushed down by `mt-auto` when there is room and simply scrolls with
    everything else when there is not, which it cannot overlap either way.

    Labels stay visible at every width this is shown at. There used to be an
    icon-only rail between `md` and `lg`, but only top-level entries carry an
    icon — everything nested rendered as a blank row there.
  -->
  <nav aria-label="Main"
    class="hidden md:flex sticky top-20 self-start h-[calc(100vh-5rem)] w-56 lg:w-64 shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-gray-200 bg-white px-2 py-4 dark:border-gray-800 dark:bg-gray-900">
    <LayoutSidebarList />
    <LayoutSidebarList_bottom class="mt-auto pt-4" />
  </nav>
</template>
