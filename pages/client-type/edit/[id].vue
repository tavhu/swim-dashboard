<script setup lang="ts">
/** Edit a ប្រភេទអតិថិជន — same form component as adding one. */
const route = useRoute();
const readOnly = checkIfPageReadOnly();

useHead({ title: "កែសម្រួលប្រភេទអតិថិជន" });
</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <h2 class="text-2xl font-[Moul] text-primary">កែសម្រួលប្រភេទអតិថិជន</h2>
      <hr class="my-2 border dark:border-gray-700" />
      <ClientTypeForm :id="route.params.id as string" :read-only="readOnly" />
    </div>
  </div>
</template>
