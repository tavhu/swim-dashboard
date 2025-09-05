// Pinia Store
import { defineStore } from "pinia";
import sidebarItem_bottom from "./data/sidebarItem_bottom";

export const useSidebarStore_bottom = defineStore("sidebar_bottom", () => {
  const items = ref(sidebarItem_bottom);
  const mobileOpen = ref(false);

  return {
    items,
    mobileOpen,
  };
});
