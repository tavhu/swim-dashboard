import { defineStore } from 'pinia';

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [] as string[],
  }),
  actions: {
    setPermissions(permissions: string[]) {
      this.permissions = permissions;
    },
    async fetchPermissions() {
      const { data, error } = await useFetch<{ permissions: string[] }>('/api/user/permissions');
      if (data.value) {
        this.setPermissions(data.value.permissions);
      }
      if (error.value) {
        console.error("Failed to fetch permissions:", error.value);
        this.setPermissions([]); 
      }
    },
  },
  getters: {
    hasPermission: (state) => (frontEndURL: string) => {
      return state.permissions.includes(frontEndURL);
    },
  },
});
