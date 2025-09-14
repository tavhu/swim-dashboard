<script setup lang="ts">
import { usePermissionStore } from "~/stores/permission";
import { routes } from "~/router/router";

const permissionStore = usePermissionStore();

const hasPermission = (routeName: string) => {
  return permissionStore.getPermission(routeName)?.read ?? true;
};

const bottomMenuRoutes = computed(() => {
  return routes.filter(
    (route) => route.meta && route.meta.menu === "bottom" && hasPermission(route.name)
  );
});
</script>

<template>
  <ul class="menu menu-sm sm:menu-md lg:menu-lg bg-base-100">
    <template v-for="route in bottomMenuRoutes" :key="route.name">
      <li v-if="route.children && route.children.length > 0">
        <details>
          <summary>
            <Icon :name="route.meta.icon" class="w-6 h-6" />
            <span class="hidden lg:block">{{ route.meta.title }}</span>
          </summary>
          <ul class="bg-base-100">
            <li v-for="child in route.children" :key="child.name">
              <NuxtLink :to="{ name: child.name }">
                <Icon :name="child.meta.icon" class="w-6 h-6" />
                <span class="hidden lg:block">{{ child.meta.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </details>
      </li>
      <li v-else>
        <NuxtLink :to="{ name: route.name }">
          <Icon :name="route.meta.icon" class="w-6 h-6" />
          <span class="hidden lg:block">{{ route.meta.title }}</span>
        </NuxtLink>
      </li>
    </template>
  </ul>
</template>
