// Pinia Store
import { defineStore } from 'pinia';
import resource from './data/resource';

export const useResource = defineStore('sidebar', () => {
  const items = ref(resource)
//   const mobileOpen = ref(false)
  return {
    items,
  }
})
