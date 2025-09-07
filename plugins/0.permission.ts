import { usePermissionStore } from '~/stores/permission';

export default defineNuxtPlugin(async (nuxtApp) => {
  const permissionStore = usePermissionStore();

  if (permissionStore.permissions.length === 0) {
    await permissionStore.fetchPermissions();
  }
});
