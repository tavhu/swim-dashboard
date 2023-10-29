import { defineStore } from "pinia";

export const isOpen = defineStore(
    "isOpen",
    () => {
  
      const isOpen = ref(false);   
      
      function toggleOpens() {
        isOpen.value = !isOpen.value
      } 
      return { isOpen, toggleOpens };
    },
    {
      persist: true,
    }
  );