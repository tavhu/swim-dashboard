<script setup lang="ts">
import {
  TwForm,
  TwFeather,
  TwFile,
  TwInput,
  TwSelect,
  TwToggle,
  useToast,
  useForm,
  type DropdownItem,
} from "vue3-tailwind";

import { type ServiceCenter } from "@prisma/client";

const { data: userDataAuth } = useAuth()

let readOnly = checkIfPageReadOnly()
const route = useRoute()
const { t } = useI18n();
const edit = route?.query?.id

useHead(() => ({ title: edit ? t("account.editTitle") : t("account.createTitle") }));

const compute = computed(() => route?.query?.id)
watch(compute, async () => {
  window.location.reload()
})
//@ts-ignore
const userDataAuthRef = computed(() => userDataAuth.value?.sub)

const config = useRuntimeConfig()
const toast = useToast()
const { uploadFiles } = useFileUpload()
const composableForm = useForm()
const formName = "User"
const formData: {
  [key: string]: any;
} = reactive({
  // null, not a placeholder. This was the string 'asdf', which the endpoint read
  // as `body.id` — truthy — so creating an account took the *update* branch and
  // tried to update a user with id 'asdf'. Prisma raised P2025 "Record to update
  // not found", the handler turned that into a 412, and the page reported a bare
  // "មិនជោគជ័យ". Creating an account could never have worked.
  id: edit ?? null,
  firstname: null,
  lastname: null,
  username: null,
  password: null,
  conPassword: null,
  image: null,
  userRoleID: null,
  serviceCenterID: null,
  organisationID: null,
  accountType: 'USER',
  status: false,
})

const usernameDuplicated = ref(false)
/**
 * Field names as they read on screen. The validator's own message is just
 * "1 error occured", which on a form with a role dropdown, two names, a username
 * and two password boxes tells the user nothing about where to look — the most
 * common miss being the role, which is a custom dropdown rather than an input.
 */
const FIELD_LABELS = computed<Record<string, string>>(() => ({
  userRoleID: t("account.role"),
  username: t("account.username"),
  password: t("account.password"),
  conPassword: t("account.confirmPassword"),
  firstname: t("account.firstname"),
  lastname: t("account.lastname"),
}));

const formRules = {
  userRoleID: ["required"],
  firstname: ["string"],
  lastname: ["string"],
  username: ["required", "string", (value: string) => {
    // A username is typed at a login box on machines whose keyboard may be in
    // Khmer, and it is compared byte-for-byte — a Khmer character or a trailing
    // space makes an account that its owner cannot reliably sign in to.
    if (value && !/^[A-Za-z0-9._-]+$/.test(value)) {
      return t("account.usernameRule");
    }
    //@ts-ignore
    if (usernameDuplicated.value && value !== userDataAuth.value?.username) {
      return t("account.usernameTaken");
    }
  }],
  password: (!edit && !formData.password) ? [
    "required",
    "string",
    "test",
    (value: string) => {
      const MIN_LENGTH = 8;
      if (!value || value?.length < MIN_LENGTH) {
        return t("account.passwordTooShort", { min: MIN_LENGTH });
      }
    },
  ] : [],
  conPassword: ["test",
    (value: string) => {
      if (value !== formData.password) {
        return t("account.passwordMismatch");
      }
    }
  ],
}

const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

const { data: organisations } = await useFetch('/api/organisation/get')
const organisationList = computed(() => {
  if (!organisations.value) return []
  return (organisations.value as any[]).map((org: any) => ({
    label: org.name,
    value: org.id,
  }))
})

const accountTypes = [
  { label: 'User', value: 'USER' },
  { label: 'Organisation', value: 'ORGANISATION' },
]

const submit = async () => {
  if (readOnly) return;
  if (!(await confirmDialog())) return;
  validator.value.clearErrors();
  await validator.value.validate();
  if (validator.value.fail()) {
    const failed: string[] = validator.value.getFailedFields?.() ?? [];
    toast.error({
      message: failed.length
        ? t("message.fillIn", { fields: failed.map((f) => FIELD_LABELS.value[f] ?? f).join(" / ") })
        : validator.value.getErrorMessage(),
    });
    isError.value = true;
    setTimeout(() => {
      isError.value = false;
    }, 1000);
    return true;
  }

  const oldImageURL = formData.image

  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous image, or none,
    // while telling the user it worked.
    toast.error({ message: t("account.photoFailed", { reason: (e as any)?.message ?? "" }) })
    return
  }
  if (image) {
    formData.image = image[0]

    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
  }

  // console.log(formData.image)
  // $fetch, not useFetch: this runs from a submit handler, and the response body
  // carries the reason a save was refused — a duplicate username, a role this
  // account may not assign — all of which were being discarded for one generic
  // line.
  try {
    await $fetch("/api/user/upsert", {
    method: "POST",
    body: JSON.stringify({
      id: formData.id,
      firstname: formData.firstname,
      lastname: formData.lastname,
      username: formData.username,
      password: formData.password ? formData.password : userProfile.value?.data?.password,
      image: formData.image,
      status: formData.status,
      userRoleID: formData.userRoleID,
      serviceCenterID: formData.serviceCenterID,
      organisationID: formData.organisationID,
      accountType: formData.accountType,
      updatePass: edit && formData.password ? true : false
    }),
    });
    toast.success({ message: t('message.saved') });
    if (!edit) clear();
  } catch (e: any) {
    toast.error({ message: apiErrorMessage(e, t('message.notSaved')) });
    isError.value = true;
    setTimeout(() => { isError.value = false; }, 1000);
  }
};

const clear = () => {
  if (readOnly) return;
  formData.firstname = null
  formData.lastname = null
  formData.username = null
  formData.password = null
  formData.conPassword = null
  formData.image = null
  formData.status = false
  formData.organisationID = null
  formData.accountType = 'USER'
  // These two were missed, so the next account started already carrying the
  // previous one's role and centre — the same way the organisation form used to
  // keep its values after a save. Assigning a role by accident is the worst
  // version of that, since it is the field that grants permissions.
  formData.userRoleID = null
  formData.serviceCenterID = null
  files.value = null
  usernameDuplicated.value = false

  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};

const files = ref();
// Errors deliberately propagate — see composables/useFileUpload.ts. The caller
// aborts the save rather than storing a record whose image silently went
// missing.
const handleImageUpload = async () => {
  if (readOnly) return;
  return await uploadFiles(files.value);
}

const { data: roleData } = await useFetch("/api/role/get", {
  method: 'get', query: {
    //@ts-ignore
    userID: userDataAuth.value?.sub
  }
})

const roleDataFormat: DropdownItem[] = new Array({ label: '', value: '' })
roleDataFormat.pop()
//@ts-ignored
roleData.value?.data?.forEach((ele: any) => {
  if (readOnly) return;
  roleDataFormat.push(
    {
      label: ele?.name,
      value: ele?.id
    }
  )
})


const { data: centerData } = await useFetch<{ data: ServiceCenter[] }>('/api/center/get', { method: 'POST' })
const centerList = computed<DropdownItem[]>(() =>
  (centerData.value?.data ?? []).map((serviceCenter: ServiceCenter) => ({
    label: serviceCenter?.nameKH,
    value: serviceCenter?.id,
  }))
)

/**
 * An administrator who belongs to one centre creates accounts for that centre.
 *
 * Leaving this blank was not a neutral default: a null serviceCenterID is a
 * ministry-level account that sees every centre, so an unfilled dropdown handed
 * out more access than the person filling it in has. The server refuses any
 * other value; this fills in the only one it will accept.
 */
const boundToOneCentre = computed(() => centerList.value.length === 1)
watchEffect(() => {
  if (!formData.serviceCenterID && boundToOneCentre.value) {
    formData.serviceCenterID = centerList.value[0].value
  }
})



let timemer = 0

const checkData = async () => {
  clearTimeout(timemer)
  timemer = window.setTimeout(async () => {
    const { data: res } = await useFetch('/api/user/checkUsername', {
      method: 'POST',
      body: JSON.stringify({
        username: formData.username
      })
    })
    if (res.value) {
      usernameDuplicated.value = true
    } else {
      usernameDuplicated.value = false
    }
    formData.username = formData.username + " "
    setTimeout(() => {
      formData.username = formData.username.slice(0, -1);
    }, 1)
    //check username after stop type for 0.5sec    
  }, 500)

}

/// edit part
const userProfile = ref()
const currentUser = ref(false)

if (edit) {
  userProfile.value = await useFetch('/api/user/checkUsername', {
    method: 'post',
    body: JSON.stringify({
      id: edit
    })
  })
  formData.id = userProfile.value?.data?.id
  formData.firstname = userProfile.value?.data?.firstname
  formData.lastname = userProfile.value?.data?.lastname
  formData.username = userProfile.value?.data?.username
  formData.password = null
  formData.conPassword = null
  formData.image = userProfile.value?.data?.image
  formData.serviceCenterID = userProfile.value?.data?.serviceCenterID
  formData.organisationID = userProfile.value?.data?.organisationID
  formData.accountType = userProfile.value?.data?.accountType
  formData.status = userProfile.value?.data?.status
  formData.userRoleID = userProfile.value?.data?.userRoleID

  if (!roleDataFormat.find(item => item.value == userProfile.value?.data?.userRoleID) && edit) {
    // console.log('should set to readonly')
    readOnly = true
  }
  //@ts-ignore
  if (route?.query?.id === userDataAuth.value?.id) {
    // console.log('current User')
    currentUser.value = true
  }
}

</script>

<template>
  <div class="font-[Battambang]">
    <div class="mt-5">
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-2xl font-[Moul] text-primary">
          {{ edit ? $t('account.editTitle') : $t('account.createTitle') }}
        </h2>
        <NuxtLink to="/register/account">
          <UButton color="gray" size="lg" icon="i-heroicons-arrow-left-20-solid">
            <span class="font-[Moul]">{{ $t('action.back') }}</span>
          </UButton>
        </NuxtLink>
      </div>
      <hr class="my-2 border dark:border-gray-700" />

      <!-- Read-only is a state of the whole page, so it is said once at the top
           rather than as a disabled button in the middle of the form. -->
      <div v-if="readOnly"
        class="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
        <TwFeather type="lock" :size="18" class="shrink-0" />
        <span>{{ $t('account.noPermission') }}</span>
      </div>

      <TwForm :name="formName" :rules="formRules" @submit="submit"
        class="space-y-4" :class="{ 'tw-shake': isError }">

        <!-- 1. Who they are -->
        <section class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ $t('account.sectionProfile') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('account.sectionProfileHint') }}</p>
          <hr class="my-3 border dark:border-gray-700" />

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 sm:col-span-4 lg:col-span-3">
              <p class="mb-2 text-sm text-gray-600 dark:text-gray-300">{{ $t('account.photo') }}</p>
              <div class="flex flex-col items-center gap-3">
                <img v-if="formData.image && !(files?.length > 0)"
                  :src="config.public.origin + '/' + formData.image" alt=""
                  class="h-28 w-28 rounded-full border border-gray-200 object-cover dark:border-gray-600" />
                <div v-else-if="!(files?.length > 0)"
                  class="flex h-28 w-28 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-gray-700 dark:text-gray-500">
                  <TwFeather type="user" :size="40" />
                </div>
                <TwFile v-model="files" class="w-full" />
                <p class="text-xs text-gray-400">{{ $t('account.photoHint') }}</p>
              </div>
            </div>

            <div class="col-span-12 grid grid-cols-12 gap-4 sm:col-span-8 lg:col-span-9">
              <div class="col-span-12 lg:col-span-6">
                <TwInput :label="$t('account.firstname')" name="firstname" :disabled="currentUser"
                  v-model="formData.firstname" type="text" />
                <CustomErrorMessage name="firstname" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <TwInput :label="$t('account.lastname')" name="lastname" :disabled="currentUser"
                  v-model="formData.lastname" type="text" />
                <CustomErrorMessage name="lastname" />
              </div>
            </div>
          </div>
        </section>

        <!-- 2. How they sign in -->
        <section class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ $t('account.sectionCredentials') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('account.sectionCredentialsHint') }}</p>
          <hr class="my-3 border dark:border-gray-700" />

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-4">
              <TwInput :label="$t('account.username')" name="username" :disabled="currentUser"
                v-model="formData.username" @keydown="checkData" autocomplete="off"
                inputmode="latin" spellcheck="false" />
              <p class="mt-1 text-xs text-gray-400">{{ $t('account.usernameHint') }}</p>
              <CustomErrorMessage name="username" />
            </div>
            <div class="col-span-12 lg:col-span-4">
              <TwInput :label="edit ? $t('account.passwordKeep') : $t('account.password')" name="password"
                type="password" v-model="formData.password" autocomplete="new-password" />
              <CustomErrorMessage name="password" />
            </div>
            <div class="col-span-12 lg:col-span-4">
              <TwInput :label="edit ? $t('account.confirmPasswordKeep') : $t('account.confirmPassword')"
                name="conPassword" type="password" v-model="formData.conPassword" autocomplete="new-password" />
              <CustomErrorMessage name="conPassword" />
            </div>
          </div>
        </section>

        <!-- 3. What they may do. Hidden entirely when editing yourself: the
             server ignores these fields in that case, so offering them would
             promise something it will not honour. -->
        <section v-if="!currentUser" class="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
          <h3 class="text-xl font-[Moul] text-primary">{{ $t('account.sectionAccess') }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('account.sectionAccessHint') }}</p>
          <hr class="my-3 border dark:border-gray-700" />

          <div class="grid grid-cols-12 gap-4">
            <div class="col-span-12 lg:col-span-6">
              <TwSelect :disabled="readOnly" :label="$t('account.role')" name="userRoleID"
                v-model="formData.userRoleID" :items="roleDataFormat"
                :placeholder="$t('action.selectOne')" />
              <CustomErrorMessage name="userRoleID" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwSelect :label="$t('account.accountType')" name="accountType" v-model="formData.accountType"
                :items="accountTypes" :placeholder="$t('action.selectOne')" :disabled="readOnly" />
              <CustomErrorMessage name="accountType" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwSelect :label="$t('account.centre')" name="serviceCenterID" v-model="formData.serviceCenterID"
                :items="centerList" :placeholder="$t('action.selectOne')"
                :disabled="readOnly || boundToOneCentre" />
              <CustomErrorMessage name="serviceCenterID" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwSelect :label="$t('account.organisation')" name="organisationID"
                v-model="formData.organisationID" :items="organisationList"
                :placeholder="$t('action.selectOne')" :disabled="readOnly" />
              <CustomErrorMessage name="organisationID" />
            </div>

            <div class="col-span-12">
              <div
                class="flex items-center justify-between gap-4 rounded-lg border p-3 dark:border-gray-700">
                <div>
                  <p class="text-gray-800 dark:text-gray-100">{{ $t('account.status') }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('account.statusHint') }}</p>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm" :class="formData.status ? 'text-primary' : 'text-gray-400'">
                    {{ formData.status ? $t('status.active') : $t('status.inactive') }}
                  </span>
                  <TwToggle name="status" id="toggle" :disabled="readOnly" v-model="formData.status" />
                </div>
              </div>
              <CustomErrorMessage name="status" />
            </div>
          </div>
        </section>

        <div class="flex justify-end gap-2 pb-8">
          <UButton :disabled="readOnly" color="gray" type="button" size="lg" class="px-4" @click="clear()">
            <span class="font-[Moul]">{{ $t('action.reset') }}</span>
          </UButton>
          <UButton color="primary" type="submit" size="lg" class="px-4" :disabled="readOnly">
            <span class="font-[Moul]">{{ $t('action.saveChanges') }}</span>
          </UButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>
