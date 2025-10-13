<script setup lang="ts">
import {
  TwDatatable,
  useToast,
  TwButton,
  TwDialog,
  useDialog,
} from "vue3-tailwind";
import type { Header } from "vue3-tailwind/dist/types/TwDatatable/types";
import CanvasForm from '~/components/organisation/CanvasForm.vue'

useHead({
  title: "អង្គភាព",
});

const toast = useToast();
const dialog = useDialog();
const isCanvasOpen = ref(false)
const selectedItem = ref(null)

const { data: organisations, refresh } = await useFetch('/api/organisation/get.get')

const headers: Header[] = [
  {
    text: "ឈ្មោះ",
    value: "name",
    main: true,
  },
  {
    text: "គេហទំព័រ",
    value: "website",
  },
  {
    text: "អ៊ីមែល",
    value: "email",
  },
  {
    text: "លេខទូរស័ព្ទ",
    value: "phoneNumber",
  },
];

const onAction = async (action: string, item: any) => {
  if (action === 'edit') {
    selectedItem.value = item
    isCanvasOpen.value = true
  }

  if (action === 'delete') {
    dialog.show({
      title: "Delete Confirmation",
      message: "Are you sure you want to delete this item?",
      confirm: {
        text: "Delete",
        class: "bg-red-500 text-white",
        action: async () => {
          await useFetch("/api/organisation/delete.post", {
            method: "POST",
            body: { id: item.id },
          });
          toast.success({ message: "Item deleted successfully" });
          refresh();
        },
      },
      cancel: {
        text: "Cancel",
      },
    });
  }
}

const handleCanvasState = (state: boolean) => {
  isCanvasOpen.value = state;
  if (!state) {
    selectedItem.value = null;
    refresh();
  }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-[Moul] text-primary">អង្គភាព</h1>
      <TwButton color="primary" size="xl" @click="isCanvasOpen = true">
        <h2 class="font-[Moul] text-xl">បង្កើតថ្មី</h2>
      </TwButton>
    </div>
    <hr class="my-4" />
    <TwDatatable :headers="headers" :rows="organisations" :actions="['edit', 'delete']" @action="onAction">
      <template #name="{ row }">
        <div class="flex items-center gap-2">
          <img :src="row.logo || '/placeholder.png'" class="w-10 h-10 rounded-full" />
          <span>{{ row.name }}</span>
        </div>
      </template>
    </TwDatatable>
    <CanvasForm :open="isCanvasOpen" :item="selectedItem" @update:open="handleCanvasState" />
  </div>
</template>
