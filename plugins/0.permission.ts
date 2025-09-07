import { usePermissionStore } from '~/stores/permission';

export default defineNuxtPlugin(async (nuxtApp) => {
  console.log("--- [Plugin] 0.permission.ts starting ---");
  if (process.server) {
    console.log("[Plugin] Running on server side, skipping.");
    return;
  }

  console.log("[Plugin] Running on client side.");
  const permissionStore = usePermissionStore();

  if (permissionStore.permissions.length === 0) {
    console.log("[Plugin] Permission store is empty, attempting to fetch permissions.");
    try {
      await permissionStore.fetchPermissions();
      console.log("[Plugin] fetchPermissions() has completed.");
      console.log("[Plugin] Final permissions in store:", JSON.stringify(permissionStore.permissions, null, 2));
    } catch (error) {
      console.error("[Plugin] An error occurred during fetchPermissions:", error);
    }
  } else {
    console.log("[Plugin] Permission store already has data, skipping fetch.");
  }
  console.log("--- [Plugin] 0.permission.ts finished ---");
});
