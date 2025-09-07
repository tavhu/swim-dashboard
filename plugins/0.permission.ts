import { usePermissionStore } from '~/stores/permission';

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("--- [Plugin] 0.permission.ts starting ---");

  // Running on client side.
  const permissionStore = usePermissionStore();

  // We only fetch if the permissions aren't already populated. This is key.
  // During SSR, this will run. On client-side navigation, the store will already
  // have data, and this will be skipped, preventing re-fetching.
  if (permissionStore.permissions.length === 0) {
    console.log("[Plugin] Permission store is empty, attempting to fetch permissions.");
    try {
      await permissionStore.fetchPermissions();
      console.log("[Plugin] fetchPermissions() has completed.");
    } catch (error) {
      console.error("[Plugin] An error occurred during fetchPermissions:", error);
    }
  }
  
  console.log("--- [Plugin] 0.permission.ts finished ---");
});
