<script setup lang="ts">
import {
  TwForm,
  TwButton,
  TwFile,
  TwInput,
  useToast,
  useForm,
  TwFeather,
  TwSelect,
  TwToggle,
  type DropdownItem,
  TwTextarea,
} from "vue3-tailwind";
import orgType from '~~/store/data/orgType'
// import  city  from '~~/store/data/address'
import gazetteers from "~/store/data/gazetteers";

const { data: userDataAuth } = useAuth()

useHead({
  title: "ចុះឈ្មោះមណ្ឌល",
});

let readOnly = checkIfPageReadOnly()
const route = useRoute()
const edit = route?.query?.id
const showGoBackButton = ref(false);

const compute = computed(() => route?.query?.id)
watch(compute, async () => {
  // window.location.reload()
  edit ? clear() : navigateTo('/center?id' + route?.query?.id)
})

const config = useRuntimeConfig()
const toast = useToast()
const { uploadImage } = useImageUpload()
const composableForm = useForm()
const formName = "center"
const formData: {
  [key: string]: any;
} = reactive({
  id: edit ? edit : 'asdf',
  nameKH: '',
  nameEN: '',
  type: '',
  logo: '',
  directorName: '',
  phoneNumber: '',
  PoBox: '',
  email: '',
  website: '',
  locationMap: '',
  Address: '',
  City: '',
  District: '',
  Commute: '',
  Village: '',
  overview: '',
  background: '',
  mission: '',
  vision: '',
  goal: '',
  ProjectSummary: '',
  status: true,
  organisationID: ''
})
// One entry per non-nullable column on ServiceCenter, so the form refuses to
// submit what the database would reject. This was `{}`, which meant
// validator.validate() passed everything and the `required` attributes on
// the inputs were decorative.
//
// `logo` is deliberately absent even though the column is non-nullable: the
// upload runs after validation and assigns formData.logo from its result, so
// requiring it here would make creating a centre impossible — the field is
// still empty at the moment the validator looks at it.
const formRules = {
  nameKH: ['required'],
  nameEN: ['required'],
  type: ['required'],
  directorName: ['required'],
  phoneNumber: ['required'],
  PoBox: ['required'],
  email: ['required'],
  website: ['required'],
  locationMap: ['required'],
  status: ['required'],
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

const submit = async () => {
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
  const oldImageURL = formData.logo
  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous logo, or none, while
    // telling the user it worked.
    toast.error({ message: "មិនអាចផ្ទុករូបភាពបានទេ៖ " + (e as any)?.message })
    return
  }
  if (image) {
    formData.logo = image[0]
    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
  }

  const { error } = await useFetch("/api/center/upsert", {
    method: "POST",
    body: JSON.stringify({
      id: formData.id,
      nameKH: formData.nameKH,
      nameEN: formData.nameEN,
      type: formData.type,
      logo: formData.logo,
      directorName: formData.directorName,
      phoneNumber: formData.phoneNumber,
      PoBox: formData.PoBox,
      email: formData.email,
      website: formData.website,
      locationMap: formData.locationMap,
      Address: formData.Address,
      City: formData.City,
      District: formData.District,
      Commute: formData.Commute,
      Village: formData.Village,
      overview: formData.overview,
      background: formData.background,
      mission: formData.mission,
      vision: formData.vision,
      goal: formData.goal,
      ProjectSummary: formData.ProjectSummary,
      status: formData.status,
      organisationID: formData.organisationID,
    }),
  });

  if (error.value?.statusCode) {
    toast.error({
      message: "មិនជោគជ័យ",
    });
  } else {
    toast.success({
      message: "ជោគជ័យ",
    });
    showGoBackButton.value = true;
  }
};

const clear = () => {
  if (readOnly) return;
  formData.status = false
  files.value = null
  formData.id = null
  formData.nameKH = null
  formData.nameEN = null
  formData.type = null
  formData.logo = null
  formData.directorName = null
  formData.phoneNumber = null
  formData.PoBox = null
  formData.email = null
  formData.website = null
  formData.locationMap = null
  formData.Address = null
  formData.City = null
  formData.District = null
  formData.Commute = null
  formData.Village = null
  formData.overview = null
  formData.background = null
  formData.mission = null
  formData.vision = null
  formData.goal = null
  formData.ProjectSummary = null
  formData.organisationID = null

  setTimeout(() => {
    validator.value.clearErrors();
  }, 100);
};

const files = ref();
// Errors deliberately propagate — see composables/useImageUpload.ts. The caller
// aborts the save rather than storing a record whose image silently went
// missing.
const handleImageUpload = async () => {
  if (readOnly) return;
  return await uploadImage(files.value);
};



const temDistricstList: any = ref([])
const SelectedDistrict: any = ref([])
const SelectedCityValue = computed(() => formData.City)

watch(SelectedCityValue, () => {
  temDistricstList.value = []
  SelectedDistrict.value = []
  temCommutesList.value = []
  tempVillageList.value = []
  SelectedCommute.value = []
  SelectedDistrict.value = gazetteers.find((element: any) => {
    return element.name.km === formData.City
  })
  SelectedDistrict?.value?.districts?.values?.forEach((eles: any) => {
    temDistricstList?.value?.push({
      label: eles.name.km + ' (' + eles.code + ')',
      value: eles.name.km
    })
  })
})

const temCommutesList: any = ref([])
const SelectedCommute: any = ref([])
const Commute = computed(() => formData.District)
watch(Commute, () => {
  SelectedCommute.value = []
  temCommutesList.value = []
  SelectedCommute.value = SelectedDistrict?.value?.districts?.values?.find((element: any) => {
    return element.name.km === formData.District
  })
  SelectedCommute?.value?.communes?.values?.forEach((ele: any) => {
    temCommutesList.value.push(
      {
        label: ele.name.km + ' (' + ele.code + ')',
        value: ele.name.km
      }
    )
  })
})


const tempVillageList: any = ref([])
const SelectedVillage: any = ref([])
const Village = computed(() => formData.Commute)
watch(Village, () => {
  tempVillageList.value = []
  SelectedVillage.value = []
  SelectedVillage.value = SelectedCommute?.value?.communes?.values?.find((element: any) => {
    return element.name.km === formData.Commute
  })

  SelectedVillage?.value?.villages?.values?.forEach((ele: any) => {
    tempVillageList.value.push({
      label: ele.name.km + ' (' + ele.code + ')',
      value: ele.name.km
    })
  });

})


// edit part
const userProfile = ref()
const currentUser = ref(false)

if (edit) {
  const { data: userProfile } = await useFetch('/api/center/getSingle', {
    method: 'post',
    body: JSON.stringify({
      id: edit
    })
  })

  formData.status = userProfile.value?.status
  formData.id = userProfile.value?.id
  formData.nameKH = userProfile.value?.nameKH
  formData.nameEN = userProfile.value?.nameEN
  formData.type = userProfile.value?.type
  formData.logo = userProfile.value?.logo
  formData.directorName = userProfile.value?.directorName
  formData.phoneNumber = userProfile.value?.phoneNumber
  formData.PoBox = userProfile.value?.PoBox
  formData.email = userProfile.value?.email
  formData.website = userProfile.value?.website
  formData.locationMap = userProfile.value?.locationMap
  formData.Address = userProfile.value?.Address
  formData.City = userProfile.value?.City
  formData.District = userProfile.value?.District
  formData.Commute = userProfile.value?.Commute
  formData.Village = userProfile.value?.Village
  formData.overview = userProfile.value?.overview
  formData.background = userProfile.value?.background
  formData.mission = userProfile.value?.mission
  formData.vision = userProfile.value?.vision
  formData.goal = userProfile.value?.goal
  formData.ProjectSummary = userProfile.value?.ProjectSummary
  formData.organisationID = userProfile.value?.organisationID


  // //@ts-ignore
  // if(route?.query?.id === userDataAuth.value?.id){
  //   // console.log('current User')
  //   currentUser.value = true
  // }
}

let temCity: any = []

gazetteers.forEach(ele => {
  temCity.push({
    label: ele.name.km + ' (' + ele.code + ')',
    value: ele.name.km
  })
})

const cityList = ref(temCity)



</script>
<template>
  <div>
    <h2 class="text-2xl font-[Moul] text-primary"> {{ edit ? `កែព័ត៌មានមណ្ឌល` : `ចុះឈ្មោះមណ្ឌល` }} </h2>
    <TwButton variant="danger" class="font-[battambang]" v-if="readOnly" :disabled="true">
      អ្នកគ្មានសិទ្ធកែប្រែ គណនីនេះទេ
    </TwButton>
    <hr class="my-2 border dark:border-gray-700" />

    <div class="font-[Battambang]">
      <TwForm :name="formName"
        class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
        :class="{
          'tw-shake': isError,
        }" :rules="formRules" @submit="submit" :custom-field-name="{
          roleName: 'ឈ្មោះតួនាទី',
          roleDescription: 'ពិពណ៌នាតួនាទី',
        }">
        <div class="col-span-12 flex justify-start  gap-3 mb-5">
          <TwFeather type="file-text" />
          <h1 class="text-lg"> ព័ត៌មានលំអិត </h1>
        </div>
        <div class="col-span-12 lg:col-span-6">
          <div class="vt-relative vt-col-span-12 vt-flex vt-items-center vt-justify-center">
            <div class="vt-relative vt-w-96">
              <img :src="config.public.origin + '/' + (formData.logo ? formData.logo : '')"
                :class="(files?.length > 0 ? ' hidden ' : ' ') + ' vt-object-cover vt-rounded vt-bg-white dark:vt-bg-gray-900 vt-shadow vt-border dark:vt-border-gray-700 '"
                alt="">
            </div>
          </div>
          <TwFile v-model="files" label="រូបភាព Logo" />
        </div>
        <div class="cols-span-12"></div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="ឈ្មោះជាភាសារខ្មែរ" name="nameKH" v-model="formData.nameKH" placeholder="ឈ្មោះជាភាសារខ្មែរ"
            type="text" />
          <CustomErrorMessage name="nameKH" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="ឈ្មោះជាភាសារអង់គ្លេស" name="nameEN" v-model="formData.nameEN"
            placeholder="ឈ្មោះជាភាសារអង់គ្លេស" type="text" />
          <CustomErrorMessage name="nameEN" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwSelect :disabled="readOnly" label="ប្រភេទស្ថាប័ន" name="type" v-model="formData.type" :items="orgType"
            placeholder="សូមជ្រើសរើស" />
          <CustomErrorMessage name="type" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwSelect :disabled="readOnly" label="ស្ថាប័ន" name="organisationID" v-model="formData.organisationID"
            :items="organisationList" placeholder="សូមជ្រើសរើស" />
          <CustomErrorMessage name="organisationID" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="user" />
          <h1 class="text-lg"> ព័ត៌មានទំនាក់ទំនង </h1>
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="ឈ្មោះនាយក" name="directorName" v-model="formData.directorName" placeholder="ឈ្មោះនាយក"
            type="text" />
          <CustomErrorMessage name="directorName" />
        </div>

        <div class="col-span-12 lg:col-span-6">
          <TwInput label="លេខទូរស័ព្ទ" name="phoneNumber" v-model="formData.phoneNumber" placeholder="លេខទូរស័ព្ទ"
            type="text" />
          <CustomErrorMessage name="phoneNumber" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="Po Box" name="PoBox" v-model="formData.PoBox" placeholder="Po Box" type="text" />
          <CustomErrorMessage name="PoBox" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="អុីមែល" name="email" v-model="formData.email" placeholder="អុីមែល" type="text" />
          <CustomErrorMessage name="email" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="គេហទំព័រ" name="website" v-model="formData.website" placeholder="គេហទំព័រ" type="text" />
          <CustomErrorMessage name="website" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="ទីតាំក្នុង Google Map" name="locationMap" v-model="formData.locationMap"
            placeholder="ទីតាំក្នុង Google Map" type="text" />
          <CustomErrorMessage name="locationMap" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="map-pin" />
          <h1 class="text-lg"> អាសយដ្ឋាន </h1>
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwSelect :disabled="readOnly" label="រាជធានី/ខេត្ត" name="city" v-model="formData.City" required
            :items="cityList" placeholder="សូមជ្រើសរើស" />
          <CustomErrorMessage name="type" />

        </div>
        <div class="col-span-12 lg:col-span-6">
          <label for="" class=" font-bold">
            ខណ្ឌ/ស្រុក
          </label>
          <ClientOnly>
            <USelect :disabled="readOnly" name="District" required v-model="formData.District"
              :options="temDistricstList" placeholder="សូមជ្រើសរើស" size="lg" />
          </ClientOnly>
          <CustomErrorMessage name="type" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <label for="" class=" font-bold">
            សង្កាត់/ឃុំ
          </label>
          <ClientOnly>
            <USelect :disabled="readOnly" name="Commute" required v-model="formData.Commute" :options="temCommutesList"
              placeholder="សូមជ្រើសរើស" size="lg" />
          </ClientOnly>
          <CustomErrorMessage name="type" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <label for="" class=" font-bold">
            ភូមិ
          </label>
          <ClientOnly>
            <USelect :disabled="readOnly" name="Commute" required v-model="formData.Village" :options="tempVillageList"
              placeholder="សូមជ្រើសរើស" size="lg" />
          </ClientOnly>
          <CustomErrorMessage name="type" />
        </div>
        <div class="col-span-12 lg:col-span-6">
          <TwInput label="អាសយដ្ឋាន" name="address" v-model="formData.Address" placeholder="ផ្ទះលេខ ផ្លូវលេខ"
            type="text" />
          <CustomErrorMessage name="address" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="droplet" />
          <h1 class="text-lg font-bold"> ទិដ្ឋភាពទូទៅ </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="overview" v-model="formData.overview" placeholder="បញ្ចូលទិដ្ឋភាពទូទៅ" class="h-[5rem]"
            type="text" />
          <CustomErrorMessage name="overview" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="loader" />
          <h1 class="text-lg font-bold"> ប្រវត្តិសាស្ត្រ </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="background" v-model="formData.background" placeholder="បញ្ចូលប្រវត្តិសាស្ត្រ"
            class="h-[5rem]" type="text" />
          <CustomErrorMessage name="background" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="send" />
          <h1 class="text-lg font-bold"> បេសកកម្ម </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="mission" v-model="formData.mission" placeholder="បញ្ចូលបេសកកម្ម" class="h-[5rem]"
            type="text" />
          <CustomErrorMessage name="mission" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="award" />
          <h1 class="text-lg font-bold"> ចក្ខុវិស័យ </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="vision" v-model="formData.vision" placeholder="បញ្ចូលចក្ខុវិស័យ" class="h-[5rem]"
            type="text" />
          <CustomErrorMessage name="vision" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="navigation" />
          <h1 class="text-lg font-bold"> គោលដៅ </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="goal" v-model="formData.goal" placeholder="បញ្ចូលគោលដៅ" class="h-[5rem]" type="text" />
          <CustomErrorMessage name="goal" />
        </div>
        <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
          <TwFeather type="message-circle" />
          <h1 class="text-lg font-bold"> សង្ខេប​គម្រោង </h1>
        </div>
        <div class="col-span-12">
          <TwTextarea name="ProjectSummary" v-model="formData.ProjectSummary" placeholder="បញ្ចូលសង្ខេប​គម្រោង"
            class="h-[5rem]" type="text" />
          <CustomErrorMessage name="ProjectSummary" />
        </div>
        <div class="col-span-12">
          <TwToggle label="Status" name="status" id="toggle" :disabled="readOnly || currentUser"
            v-model="formData.status" />
          <CustomErrorMessage name="status" />
        </div>
        <div class="col-span-12 flex justify-end gap-1 ">
          <UButton :disabled="readOnly" color="gray" type="button" square size="lg"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clear()">
            កំណត់ឡើងវិញ
          </UButton>
          <UButton color="primary" type="submit" size="lg" class="px-4" :disabled="readOnly"> រក្សាទុក </UButton>
          <UButton v-if="showGoBackButton" color="blue" type="button" size="lg" class="px-4 font-[Battambang]"
            @click="navigateTo('/center/list')"> ត្រលប់ក្រោយ </UButton>
        </div>
      </TwForm>
    </div>
  </div>
</template>
