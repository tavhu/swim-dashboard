<script setup lang="ts">
import { TwFeather } from "vue3-tailwind";

/**
 * ភាសា / Language.
 *
 * Khmer is the default and the system's first language; English sits beside it
 * for staff and partners who do not read Khmer. The choice is kept in the
 * swims_locale cookie, so it survives a reload and a new tab without putting a
 * prefix in the URL — every route in the app is already linked by path.
 *
 * The two names are written in their own script, which is how a language picker
 * stays usable to someone who cannot read the current one.
 */
const { locale, locales, setLocale } = useI18n();

const options = computed(() =>
  (locales.value as any[]).map((l) => ({ code: l.code, name: l.name }))
);

const current = computed(() => options.value.find((l) => l.code === locale.value));
</script>

<template>
  <UDropdown :items="[options.map((l) => ({
    label: l.name,
    // A tick beside the active one: the trigger is abbreviated, so without it
    // an open menu gives no clue which is in force.
    icon: l.code === locale ? 'i-heroicons-check-20-solid' : undefined,
    click: () => setLocale(l.code),
  }))]" :popper="{ placement: 'bottom-end' }">
    <UButton color="gray" variant="ghost" size="sm" :aria-label="$t('common.language')">
      <TwFeather type="globe" :size="16" class="mr-1 shrink-0" />
      <span class="text-sm">{{ current?.name ?? locale }}</span>
    </UButton>
  </UDropdown>
</template>
