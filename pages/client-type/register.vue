<script setup lang="ts">
/**
 * Add a ប្រភេទអតិថិជន. The fields live in the shared form component, which the
 * edit page uses too.
 */
const readOnly = checkIfPageReadOnly();

useHead({ title: tr("បង្កើតប្រភេទអតិថិជន") });
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បង្កើតប្រភេទអតិថិជន') }}</h2>
      <hr class="my-2 border dark:border-gray-700" />
      <ClientTypeForm :read-only="readOnly" />
    </div>
  </div>
</template>
