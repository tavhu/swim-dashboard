import { defineStore } from "pinia";

export const isOpen_bottom = defineStore(
  "isOpen_bottom",
  () => {
    const isOpen_bottom = ref(false);

    function toggleOpens() {
      isOpen_bottom.value = !isOpen_bottom.value;
    }
    return { isOpen_bottom, toggleOpens };
  },
  {
    persist: true,
  }
);
