<script setup lang="ts">
</script>

<template>
  <!--
    Both menus, not just the main one. The bottom (Settings) menu is rendered
    beside the main one on desktop, but it was never included here, so on a
    phone everything under Settings was unreachable.
  -->
  <nav aria-label="Main (mobile)" class="max-h-[70vh] overflow-y-auto px-2 pb-3">
    <LayoutSidebarList />
    <div class="mt-2 border-t border-gray-200 pt-2 dark:border-gray-800">
      <LayoutSidebarList_bottom />
    </div>
  </nav>
</template>
