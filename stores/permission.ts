import { defineStore } from "pinia";

interface Permission {
  frontEndURL: string;
  read: boolean;
  granted: boolean;
}

export const usePermissionStore = defineStore("permission", {
  state: () => ({
    permissions: [] as Permission[],
  }),
  actions: {
    setPermissions(permissions: Permission[]) {
      console.log("--- [Store] setPermissions called ---");
      console.log("[Store] Setting permissions:", JSON.stringify(permissions, null, 2));
      this.permissions = permissions;
      console.log("--- [Store] setPermissions finished ---");
    },
    async fetchPermissions() {
      console.log("--- [Store] fetchPermissions action started ---");
      try {
        const { data, error } = await useFetch<{ permissions: Permission[] }>(
          "/api/user/permissions"
        );

        if (error.value) {
          console.error("[Store] Error fetching permissions:", JSON.stringify(error.value, null, 2));
          this.setPermissions([]);
        } else if (data.value) {
          console.log("[Store] Successfully fetched data:", JSON.stringify(data.value, null, 2));
          this.setPermissions(data.value.permissions);
        } else {
          console.log("[Store] Fetch returned no data and no error.");
          this.setPermissions([]);
        }
      } catch (e) {
        console.error("[Store] A critical error occurred in fetchPermissions action:", e);
        this.setPermissions([]);
      }
      console.log("--- [Store] fetchPermissions action finished ---");
    },
  },
  getters: {
    getPermission: (state) => (frontEndURL: string) => {
      return state.permissions.find((p) => p.frontEndURL === frontEndURL);
    },
    hasPermission: (state) => (frontEndURL: string) => {
      const p = state.permissions.find((p) => p.frontEndURL === frontEndURL);
      return p?.read || p?.granted;
    },
    hasWritePermission: (state) => (frontEndURL: string) => {
      const p = state.permissions.find((p) => p.frontEndURL === frontEndURL);
      return p?.granted ?? false;
    },
  },
});
