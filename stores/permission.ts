import { defineStore } from 'pinia';

interface Permission {
  frontEndURL: string;
  read: boolean;
  granted: boolean;
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    permissions: [] as Permission[],
  }),
  actions: {
    setPermissions(permissions: Permission[]) {
      this.permissions = permissions;
    },
    async fetchPermissions() {
      const { data, error } = await useFetch<{ permissions: Permission[] }>('/api/user/permissions');
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
    getPermission: (state) => (frontEndURL: string) => {
      return state.permissions.find(p => p.frontEndURL === frontEndURL);
    },
    hasPermission: (state) => (frontEndURL: string) => {
        const p = state.permissions.find(p => p.frontEndURL === frontEndURL);
        return p?.read || p?.granted;
    },
    hasWritePermission: (state) => (frontEndURL: string) => {
        const p = state.permissions.find(p => p.frontEndURL === frontEndURL);
        return p?.granted ?? false;
    },
  },
});
