<script setup lang="ts">
import { Query, query } from "firebase/firestore";
import {
  useForm,
  TwInput,
  TwForm,
  TwTextarea,
  useToast,
  TwFeather,
  TwOffcanvas,
} from "vue3-tailwind";

const { data: userDataAuth } = useAuth()

// import { useResource } from '~~/store/resource'
const readOnly = checkIfPageReadOnly()
const { t } = useI18n();
// const resource = useResource()

/**
 * Every page the grid can grant, plus the role-assignment gates.
 *
 * This used to be filtered to the resources the caller could already read,
 * which is the wrong set for an editor — a page you cannot see is exactly the
 * one you may need to grant to someone else.
 */
const { data: res, refresh: refreshResources } = await useFetch<any>("/api/role/readResource");
const resource = computed<any[]>(() => res.value?.data ?? []);
const roleGates = computed<any[]>(() => res.value?.roleGates ?? []);

/** Group headings, in the order the menu presents them. */
const GROUP_LABELS: Record<string, string> = {
  dashboard: "ផ្ទាំងគ្រប់គ្រង",
  client: "អតិថិជន និងទម្រង់ទី១-៦",
  service: "សេវា និងប្រភេទអតិថិជន",
  centre: "មណ្ឌល",
  organisation: "ស្ថាប័ន",
  account: "គណនី និងសិទ្ធិ",
  report: "របាយការណ៍",
};
const groupedResources = computed(() => {
  const out: { key: string; label: string; rows: any[] }[] = [];
  for (const r of resource.value) {
    let g = out.find((x) => x.key === r.group);
    if (!g) {
      g = { key: r.group, label: GROUP_LABELS[r.group] ?? r.group, rows: [] };
      out.push(g);
    }
    g.rows.push(r);
  }
  return out;
});

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
      message: tr("មិនជោគជ័យ"),
    });
  } else {
    toast.success({
      message: tr("ជោគជ័យ"),
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
  title: tr("តួនាទី និងការអនុញ្ញាត"),
});



/**
 * The rows currently on screen. editRecord() and the permission canvas both read
 * a role out of here by id rather than refetching it, so the fetcher keeps it in
 * step with whatever page the table is showing.
 */
const globalData: any = ref({ data: [], totalData: 0 });

const table = ref<any>(null);

const columns = [
  { key: "name", label: tr("ឈ្មោះ"), sortable: true, class: "w-[280px]" },
  { key: "description", label: tr("ការពិពណ៌នាតួនាទី"), sortable: true },
  { key: "actions", label: tr("សកម្មភាព"), class: "w-[340px]" },
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
  if (!(await confirmDelete(t("confirm.deleteRole", { name: row?.name ?? "" })))) return;

  try {
    await $fetch("/api/role/delete", { method: "POST", body: { id: row.id } });
    toast.success({ message: tr("ជោគជ័យ") });
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, "មិនជោគជ័យ")});
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

/** The three states the grid offers, derived from the two stored booleans. */
type Access = "write" | "read" | "none";

const stateOf = (resourceID: string): Access => {
  const row = (readRoleToResource.value?.data ?? []).find(
    (e: any) => e.resourceID === resourceID && e.roleID === refClickRoleID.value
  );
  if (!row) return "none";
  if (row.granted) return "write";
  return row.read ? "read" : "none";
};

/** Super Admin's grid is fixed at full access — see the endpoint for why. */
const editingSuperAdmin = computed(() =>
  globalData.value?.data?.find((r: any) => r.id === refClickRoleID.value)?.name === "Super Admin"
);

const saving = ref<string | null>(null);

const setAccess = async (resourceID: string, next: Access) => {
  if (readOnly || editingSuperAdmin.value) return;
  saving.value = resourceID;
  try {
    // $fetch from a click handler, and the grid is refetched rather than
    // patched locally so what is on screen is what the server stored.
    await $fetch("/api/role/updateRoleToResource", {
      method: "POST",
      body: {
        roleID: refClickRoleID.value,
        resourceID,
        granted: next === "write",
        read: next !== "none",
      },
    });
    await refresh();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t("message.notSaved")) });
    await refresh();
  } finally {
    saving.value = null;
  }
}

const { data: readRoleToResource, refresh } = await useFetch<any>("/api/role/getRoleToResource");

</script>

<template>
  <div class="font-[Battambang]">
    <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បង្កើតតួនាទី') }}</h2>
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
          <TwInput :label="tr('ឈ្មោះតួនាទី')" name="roleName" v-model="formData.roleName" placeholder="ប្រអប់បញ្ចូល"
            type="text" />
          <CustomErrorMessage name="roleName" />
        </div>
        <div class="col-span-12">
          <TwTextarea :label="tr('ការពិពណ៌នាតួនាទី')" name="roleDescription" v-model="formData.roleDescription"
            placeholder="ប្រអប់បញ្ចូល" type="text" />
          <CustomErrorMessage name="roleDescription" />
        </div>
        <div class="col-span-12 flex justify-end gap-1">
          <UButton :ripple="true" :disabled="readOnly" color="gray" type="button" size="lg"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clear()">{{ tr('កំណត់ឡើងវិញ') }}</UButton>

          <UButton :disabled="readOnly" size="lg" type="submit" color="primary" class="px-4">{{ tr('រក្សាទុក') }}</UButton>
        </div>
      </TwForm>
    </div>

    <div class="mt-5">
      <h2 class="text-2xl font-[Moul] text-primary">{{ tr('បញ្ចីតួនាទី') }}</h2>
      <hr class="my-2 border dark:border-gray-700" />
      <DataTableServer
        ref="table"
        :columns="columns"
        :fetcher="fetcher"
        sort-by="name"
        sort-type="asc"
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
              @click="AddPermission(row.id)">{{ tr('ការអនុញ្ញាត') }}</UButton>
            <UButton :disabled="readOnly" icon="i-heroicons-pencil-square" size="sm" color="gray"
              @click="editRecord(row.id)">{{ tr('កែសម្រួល') }}</UButton>
            <UButton :disabled="readOnly" icon="i-heroicons-trash" size="sm" color="red"
              @click="deleteRecord(row)">{{ tr('លុបចេញ') }}</UButton>
          </div>
        </template>
      </DataTableServer>
    </div>

    <TwOffcanvas position="right" width="800px" ref="openisTrue">
      <template #headerTitle>
        <span class="font-[Moul] text-primary">{{ tr('កែសម្រួលតួនាទី') }}</span></template>
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
              <TwInput :label="tr('ឈ្មោះតួនាទី')" name="roleName" v-model="formDataEdit.roleName" placeholder="ប្រអប់បញ្ចូល"
                type="text" />
              <CustomErrorMessage name="roleName" />
            </div>
            <div class="col-span-12">
              <TwTextarea :label="tr('ការពិពណ៌នាតួនាទី')" name="roleDescription" v-model="formDataEdit.roleDescription"
                placeholder="ប្រអប់បញ្ចូល" type="text" />
              <CustomErrorMessage name="roleDescription" />
            </div>
            <div class="col-span-12 flex justify-end gap-1">
              <UButton :ripple="true" color="gray" square type="button" size="lg"
                class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEdit()">{{ tr('កំណត់ឡើងវិញ') }}</UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit">{{ tr('រក្សាទុក') }}</UButton>
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
          <!-- Locked, with the reason said out loud. The permission screen is
               itself a permission: a Super Admin who denied themselves `role`
               could not grant it back, and no other role may. -->
          <div v-if="editingSuperAdmin"
            class="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            <TwFeather type="lock" :size="18" class="mt-0.5 shrink-0" />
            <span>{{ tr('សិទ្ធិរបស់ Super Admin ត្រូវបានកំណត់ជាការអនុញ្ញាតពេញលេញ ហើយមិនអាចកែបានទេ។') }}</span>
          </div>

          <div class="space-y-5">
            <section v-for="group in groupedResources" :key="group.key"
              class="overflow-hidden rounded-lg border dark:border-gray-700">
              <h4 class="bg-gray-50 px-4 py-2 font-[Moul] text-primary dark:bg-gray-900/50">
                {{ group.label }}
              </h4>
              <table class="w-full text-left text-sm">
                <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="px-4 py-2 font-normal">{{ tr('ព័ត៌មានលម្អិតអំពីការអនុញ្ញាត') }}</th>
                    <th class="w-28 px-2 py-2 text-center font-normal">{{ tr('អនុញ្ញាត') }}</th>
                    <th class="w-28 px-2 py-2 text-center font-normal">{{ tr('បានត្រឹមមើល') }}</th>
                    <th class="w-28 px-2 py-2 text-center font-normal">{{ tr('មិនអនុញ្ញាត') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="item in group.rows" :key="item.id"
                    :class="saving === item.id ? 'opacity-50' : ''">
                    <td class="px-4 py-2.5 text-gray-800 dark:text-gray-100">
                      {{ item.name }}
                      <!-- A page that only displays cannot be "write", so the
                           option is not offered rather than offered and ignored. -->
                      <span v-if="item.readOnlyPage" class="ml-1 text-xs text-gray-400">{{ tr('(មើលតែប៉ុណ្ណោះ)') }}</span>
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      <URadio v-if="!item.readOnlyPage" :name="`acc-${item.id}`"
                        :checked="stateOf(item.id) === 'write'"
                        :disabled="readOnly || editingSuperAdmin || saving === item.id"
                        @change="setAccess(item.id, 'write')" />
                      <span v-else class="text-gray-300 dark:text-gray-600">—</span>
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      <URadio :name="`acc-${item.id}`" :checked="stateOf(item.id) === 'read'"
                        :disabled="readOnly || editingSuperAdmin || saving === item.id"
                        @change="setAccess(item.id, 'read')" />
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      <URadio :name="`acc-${item.id}`" :checked="stateOf(item.id) === 'none'"
                        :disabled="readOnly || editingSuperAdmin || saving === item.id"
                        @change="setAccess(item.id, 'none')" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <!-- Not pages. A Resources row whose frontEndURL is a role id means
                 "may hand out this role", which is what stops an Admin creating
                 a Super Admin. Shown apart so it is not read as a screen. -->
            <section v-if="roleGates.length" class="overflow-hidden rounded-lg border dark:border-gray-700">
              <h4 class="bg-gray-50 px-4 py-2 font-[Moul] text-primary dark:bg-gray-900/50">{{ tr('សិទ្ធិផ្តល់តួនាទី') }}</h4>
              <table class="w-full text-left text-sm">
                <thead class="border-b text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <tr>
                    <th class="px-4 py-2 font-normal">{{ tr('តួនាទីដែលអាចផ្តល់ឲ្យបាន') }}</th>
                    <th class="w-28 px-2 py-2 text-center font-normal">{{ tr('អនុញ្ញាត') }}</th>
                    <th class="w-28 px-2 py-2 text-center font-normal">{{ tr('មិនអនុញ្ញាត') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="gate in roleGates" :key="gate.id" :class="saving === gate.id ? 'opacity-50' : ''">
                    <td class="px-4 py-2.5 text-gray-800 dark:text-gray-100">{{ gate.name }}</td>
                    <td class="px-2 py-2.5 text-center">
                      <URadio :name="`gate-${gate.id}`" :checked="stateOf(gate.id) === 'write'"
                        :disabled="readOnly || editingSuperAdmin || saving === gate.id"
                        @change="setAccess(gate.id, 'write')" />
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      <URadio :name="`gate-${gate.id}`" :checked="stateOf(gate.id) !== 'write'"
                        :disabled="readOnly || editingSuperAdmin || saving === gate.id"
                        @change="setAccess(gate.id, 'none')" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </div>
    </TwOffcanvas>
  </div>
</template>
