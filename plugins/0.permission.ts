import { usePermissionStore } from '~/stores/permission';

export default defineNuxtPlugin(async (nuxtApp) => {
  if (process.server) {
    return;
  }

  const permissionStore = usePermissionStore();

  // To avoid re-fetching on every navigation, only fetch if the store is empty.
  if (permissionStore.permissions.length === 0) {
    await permissionStore.fetchPermissions();
  }
});
