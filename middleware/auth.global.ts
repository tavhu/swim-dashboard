import { usePermissionStore } from '~/stores/permission';

export default defineNuxtRouteMiddleware(async (to, from) => {
  const { status } = useAuth();
  const permissionStore = usePermissionStore();

  if (status.value === 'authenticated' && permissionStore.permissions.length === 0) {
    await permissionStore.fetchPermissions();
  }
});
