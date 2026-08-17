<script setup lang="ts">
import { TwButton, TwDialog, TwFeather } from "vue3-tailwind";
import { usePermissionStore } from '~/stores/permission';
import { watch } from 'vue';

/** Set by confirmDelete() just before the dialog fires — see
 *  composables/globalFunction.ts. TwDialog drops keys it does not know, so the
 *  danger styling cannot travel on the dialog object itself. */
const isDangerous = confirmDialogDanger;

const { status } = useAuth();

// IMPORTANT: This logic MUST run only on the client.
// On the server, this code doesn't have the user's session cookie, which causes a 401 error.
if (process.client) {
  const permissionStore = usePermissionStore();

  // Watch the authentication status
  watch(status, (newStatus) => {
    if (newStatus === 'authenticated') {
      // If the user is logged in, fetch their permissions.
      permissionStore.fetchPermissions();
    } else if (newStatus === 'unauthenticated') {
      // If the user logs out, clear their permissions from the store.
      permissionStore.setPermissions([]);
    }
  }, { immediate: true }); // immediate: true runs the watcher once on client-side load.
}

</script>
<template>
  <NuxtLayout>
     <!-- <NuxtLoadingIndicator /> -->
    <TwDialog>
      <template v-slot="{ isShown, dialog, confirm, reject }">
        <div class="fixed top-0 left-0 z-50">
          <transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0"
          >
            <div
              class="flex items-center justify-center h-screen w-screen bg-gray-400 dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70"
              v-if="isShown.value"
            ></div>
          </transition>
          <transition
            enter-active-class="ease-out duration-300"
            enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to-class="opacity-100 translate-y-0 sm:scale-100"
            leave-active-class="ease-in duration-200"
            leave-from-class="opacity-100 translate-y-0 sm:scale-100"
            leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              class="flex items-center justify-center h-screen w-screen absolute top-0 px-4 font-[Battambang]"
              @click.self="reject"
              v-if="isShown.value"
            >
              <!-- Same card language as the rest of the app: white on the grey
                   page, rounded-lg, a Moul heading. `danger` puts the whole
                   dialog in red — a delete should not look like a save. -->
              <div
                class="w-full max-w-md -mt-10 overflow-hidden rounded-lg bg-white shadow-xl dark:bg-gray-800"
              >
                <div class="flex items-start gap-4 p-5">
                  <div
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    :class="isDangerous
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                      : 'bg-primary/10 text-primary'"
                  >
                    <TwFeather :size="24" :type="dialog.icon || (isDangerous ? 'alert-triangle' : 'help-circle')" />
                  </div>
                  <div class="min-w-0 pt-0.5">
                    <h3 class="text-lg font-[Moul] text-gray-800 dark:text-gray-100">
                      {{ dialog.title }}
                    </h3>
                    <p
                      class="mt-1 text-base leading-relaxed text-gray-600 dark:text-gray-300"
                      v-if="dialog.description"
                      v-html="dialog.description"
                    ></p>
                  </div>
                </div>
                <div
                  class="flex justify-end gap-2 border-t bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <UButton color="gray" size="lg" @click="reject">
                    <span class="font-[Moul]">{{ dialog.rejectText }}</span>
                  </UButton>
                  <UButton :color="isDangerous ? 'red' : 'primary'" size="lg" @click="confirm">
                    <span class="font-[Moul]">{{ dialog.acceptText }}</span>
                  </UButton>
                </div>
              </div>
            </div>
          </transition>
          
        </div>
      </template>
    </TwDialog>

    <NuxtPage />
  </NuxtLayout>
</template>
<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>