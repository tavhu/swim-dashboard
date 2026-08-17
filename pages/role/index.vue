<script setup lang="ts">
import { Query, query } from "firebase/firestore";
import {
  useForm,
  TwInput,
  TwForm,
  TwTextarea,
  useToast,
  TwOffcanvas,
} from "vue3-tailwind";

const { data: userDataAuth } = useAuth()

// import { useResource } from '~~/store/resource'
const readOnly = checkIfPageReadOnly()
const { t } = useI18n();
// const resource = useResource()

const { data: res } = await useFetch("/api/role/readResource", {
  method: "POST", query: {
    //@ts-ignored
    userID: userDataAuth.value?.sub
  }
});
//@ts-ignore
const resource: any = res.value?.data;

const toast = useToast();
const composableForm = useForm();

const formName = "Role";
const formData: {
  [key: string]: any;
} = reactive({
  roleName: null,
});

const formRules = {
  roleName: ["required", "string"],
  roleDescription: ["string"],
};

const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

async function submit() {
  if (readOnly) return;
  if (!(await confirmDialog())) return;
  validator.value.clearErrors();
  await validator.value.validate();
  if (validator.value.fail()) {
    toast.error({
      message: validator.value.getErrorMessage(),
    });
    isError.value = true;
    setTimeout(() => {
      isError.value = false;
    }, 1000);
    return true;
  }

  const { error } = await useFetch("/api/role/create", {
    method: "POST",
    body: JSON.stringify({
      roleName: formData.roleName,
      description: formData.roleDescription,
    }),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: t('message.notSaved'),
    });
  } else {
    toast.success({
      message: t('message.saved'),
    });
    clear();
  }
  table.value?.refresh();
}

const clear = () => {
  formData.roleName = null;
  formData.roleDescription = null;
  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};

const formNameEdit = "EditRole";
const formDataEdit: {
  [key: string]: any;
} = reactive({
  roleName: null,
});

const formRulesEdit = {
  roleName: ["required", "string"],
  roleDescription: ["string"],
};

const isErrorEdit = ref(false);
const formEdit = computed(() => composableForm.getForm(formNameEdit));
const validatorEdit = computed(() => formEdit.value.validator);

async function submitEdit() {
  if (readOnly) return;
  if (!(await confirmDialog())) return;
  validatorEdit.value.clearErrors();
  await validatorEdit.value.validate();
  if (validatorEdit.value.fail()) {
    toast.error({
      message: validatorEdit.value.getErrorMessage(),
    });
    isError.value = true;
    setTimeout(() => {
      isError.value = false;
    }, 1000);
    return true;
  }

  const { error } = await useFetch("/api/role/edit", {
    method: "POST",
    body: JSON.stringify({
      roleName: formDataEdit.roleName,
      description: formDataEdit.roleDescription,
      id: editID.value.toString(),
    }),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "មិនឈោកជ័យ",
    });
  } else {
    toast.success({
      message: "ជោកជ័យ",
    });
    clearEdit();
  }
  table.value?.refresh();
  openisTrue.value.closeOffCanvas();
}

const clearEdit = () => {
  formDataEdit.roleName = null;
  formDataEdit.roleDescription = null;
  setTimeout(() => {
    validatorEdit.value.clearErrors();
  }, 100);
};

useHead({
  title: "តួនាទី និងការអនុញ្ញាត",
});



/**
 * The rows currently on screen. editRecord() and the permission canvas both read
 * a role out of here by id rather than refetching it, so the fetcher keeps it in
 * step with whatever page the table is showing.
 */
const globalData: any = ref({ data: [], totalData: 0 });

const table = ref<any>(null);

const columns = [
  { key: "name", label: "ឈ្មោះ", sortable: true, class: "w-[280px]" },
  { key: "description", label: "ការពិពណ៌នាតួនាទី", sortable: true },
  { key: "actions", label: "សកម្មភាព", class: "w-[340px]" },
];

const fetcher = (q: any) =>
  $fetch<{ data: any[]; total: number }>(
    "/api/role/get?" +
      new URLSearchParams({
        limit: String(q.limit),
        skip: String(q.skip),
        q: q.search,
        sortBy: q.sortBy,
        sortType: q.sortType,
        //@ts-ignore — filters the list to roles this caller may assign
        userID: userDataAuth.value?.sub,
      }),
    { method: "get" }
  ).then((res) => {
    globalData.value = { data: res?.data ?? [], totalData: res?.total ?? 0 };
    return res;
  });

const deleteRecord = async (row: any) => {
  if (readOnly) return;
  if (!(await confirmDelete(`លុបតួនាទី ${row?.name ?? ""}។`))) return;

  try {
    await $fetch("/api/role/delete", { method: "POST", body: { id: row.id } });
    toast.success({ message: "ជោគជ័យ" });
  } catch (e: any) {
    toast.error({ message: e?.data?.error ?? e?.message ?? "មិនជោគជ័យ" });
  }
  table.value?.refresh();
};

const openisTrue = ref();
const editID = ref("");
const editRecord = async (id: string) => {
  if (readOnly) return;
  openisTrue.value.openOffCanvas();
  editID.value = id;
  const datRes = globalData.value.data.find((element: any) => element.id == id);
  formDataEdit.roleName = datRes.name;
  formDataEdit.roleDescription = datRes.description;
  return true;
}

const PopUPPermission = ref();
const refClickRoleID = ref("");
const AddPermission = (clickPermissionID: string) => {
  if (readOnly) return;
  PopUPPermission.value.openOffCanvas();
  refClickRoleID.value = clickPermissionID;
  refresh();
};


const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: token } = await useFetch("/api/token", { headers });

const grantedResourceToRole = async (resourceID: string, granted: boolean, read: boolean) => {
  // console.log refClickRoleID.value, resourceID);

  const { error } = await useFetch("/api/role/updateRoleToResource", {
    method: "POST",
    body: JSON.stringify({
      roleID: refClickRoleID.value,
      resourceID: resourceID,
      granted: granted,
      read: read
    }),
  });

  if (error.value?.statusCode) {
    PopUPPermission.value.closeOffCanvas();
    toast.error({
      message: "មិនឈោកជ័យ",
    });
  }
  //  else {
  //   toast.success({
  //     message: "ជោកជ័យ",
  //   });
  // }
}

const { data: readRoleToResource, refresh } = await useFetch(
  "/api/role/getRoleToResource",
  {
    method: "POST",
    body: JSON.stringify({
      //@ts-ignored
      userID: userDataAuth.value?.sub
    }),
  }
);

</script>

<template>
  <div class="font-[Battambang]">
    <h2 class="text-2xl font-[Moul] text-primary">បង្កើតតួនាទី</h2>
    <hr class="my-2 border dark:border-gray-700" />
    <div>
      <TwForm :name="formName"
        class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
        :class="{
          'tw-shake': isError,
        }" :rules="formRules" @submit="submit()" :custom-field-name="{
          roleName: 'ឈ្មោះតួនាទី',
          roleDescription: 'ពិពណ៌នាតួនាទី',
        }">
        <div class="col-span-12">
          <TwInput label="ឈ្មោះតួនាទី" name="roleName" v-model="formData.roleName" placeholder="ប្រអប់បញ្ចូល"
            type="text" />
          <CustomErrorMessage name="roleName" />
        </div>
        <div class="col-span-12">
          <TwTextarea label="ការពិពណ៌នាតួនាទី" name="roleDescription" v-model="formData.roleDescription"
            placeholder="ប្រអប់បញ្ចូល" type="text" />
          <CustomErrorMessage name="roleDescription" />
        </div>
        <div class="col-span-12 flex justify-end gap-1">
          <UButton :ripple="true" :disabled="readOnly" color="gray" type="button" size="lg"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clear()">
            កំណត់ឡើងវិញ
          </UButton>

          <UButton :disabled="readOnly" size="lg" type="submit" color="primary" class="px-4"> រក្សាទុក </UButton>
        </div>
      </TwForm>
    </div>

    <div class="mt-5">
      <h2 class="text-2xl font-[Moul] text-primary">បញ្ចីតួនាទី</h2>
      <hr class="my-2 border dark:border-gray-700" />
      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="name"
        sort-type="asc"
        search-placeholder="ស្វែងរកតាមឈ្មោះ ឬការពិពណ៌នា..."
        empty-text="មិនទាន់មានតួនាទីនៅឡើយទេ។"
      >
        <template #name-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.name }}</span>
        </template>
        <template #description-data="{ row }">
          <span class="text-gray-800 dark:text-gray-100">{{ row.description || '—' }}</span>
        </template>
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton :disabled="readOnly" icon="i-heroicons-lock-closed" size="sm" color="primary"
              @click="AddPermission(row.id)">
              ការអនុញ្ញាត
            </UButton>
            <UButton :disabled="readOnly" icon="i-heroicons-pencil-square" size="sm" color="gray"
              @click="editRecord(row.id)">
              កែសម្រួល
            </UButton>
            <UButton :disabled="readOnly" icon="i-heroicons-trash" size="sm" color="red"
              @click="deleteRecord(row)">
              លុបចេញ
            </UButton>
          </div>
        </template>
      </DataTableServer>
    </div>

    <TwOffcanvas position="right" width="800px" ref="openisTrue">
      <template #headerTitle>
        <span class="font-[Moul] text-primary"> កែសម្រួលតួនាទី </span></template>
      <div class="p-4 overflow-auto font-[battambang]">
        <div>
          <TwForm :name="formNameEdit"
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
            :class="{
              'tw-shake': isErrorEdit,
            }" :rules="formRulesEdit" @submit="submitEdit()" :custom-field-name="{
              roleName: 'ឈ្មោះតួនាទី',
              roleDescription: 'ពិពណ៌នាតួនាទី',
            }">
            <div class="col-span-12">
              <TwInput label="ឈ្មោះតួនាទី" name="roleName" v-model="formDataEdit.roleName" placeholder="ប្រអប់បញ្ចូល"
                type="text" />
              <CustomErrorMessage name="roleName" />
            </div>
            <div class="col-span-12">
              <TwTextarea label="ការពិពណ៌នាតួនាទី" name="roleDescription" v-model="formDataEdit.roleDescription"
                placeholder="ប្រអប់បញ្ចូល" type="text" />
              <CustomErrorMessage name="roleDescription" />
            </div>
            <div class="col-span-12 flex justify-end gap-1">
              <UButton :ripple="true" color="gray" square type="button" size="lg"
                class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEdit()">
                កំណត់ឡើងវិញ
              </UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
            </div>
          </TwForm>
        </div>
      </div>
    </TwOffcanvas>

    <TwOffcanvas position="right" width="800px" ref="PopUPPermission">
      <template #headerTitle>
        <span class="font-[Moul] text-primary"> ការអនុញ្ញាតរបស់ {{globalData.data?.find((item: any) => item.id ==
          refClickRoleID)?.name}} </span></template>
      <div class="p-4 overflow-auto font-[battambang]">
        <div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" class="px-6 py-3 text-sm md:text-md lg:text-lg">
                    ព័ត៌មានលម្អិតអំពីការអនុញ្ញាត
                  </th>
                  <th scope="col" class="px-6 py-3 text-sm md:text-md lg:text-lg text-center">
                    អនុញ្ញាត
                  </th>
                  <th scope="col" class="px-6 py-3 text-sm md:text-md lg:text-lg text-center">
                    បានត្រឹមមើល
                  </th>
                  <th scope="col" class="px-6 py-3 text-sm md:text-md lg:text-lg text-center">
                    មិនអនុញ្ញាត
                  </th>

                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in resource" :key="item?.id" :class="index % 2 == 0
                  ? 'bg-white border-b dark:bg-gray-900 dark:border-gray-700'
                  : 'border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700'
                  ">
                  <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {{ item?.name }}
                  </th>
                  <td class="px-6 py-4 text-center">
                    <URadio :name="'bordered-checkbox' + item?.id" @click="grantedResourceToRole(item?.id, true, true)"
                      :checked="
                        //@ts-ignore
                        readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                          //@ts-ignore                        
                        )?.granted && readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                        )?.read
                        " />
                  </td>
                  <td class="px-6 py-4 text-center">
                    <URadio :name="'bordered-checkbox' + item?.id" @click="grantedResourceToRole(item?.id, false, true)"
                      :checked="
                        //@ts-ignore
                        !readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                          //@ts-ignore              
                        )?.granted && readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                        )?.read
                        " />
                  </td>
                  <td class="text-center ">
                    <URadio :name="'bordered-checkbox' + item?.id"
                      @click="grantedResourceToRole(item?.id, false, false)" :checked="
                        //@ts-ignore
                        !readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                          //@ts-ignore               
                        )?.granted && !readRoleToResource?.data?.find(
                          (e: any) =>
                            e.resourceID == item?.id &&
                            refClickRoleID == e.roleID
                        )?.read
                        " />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </TwOffcanvas>
  </div>
</template>
