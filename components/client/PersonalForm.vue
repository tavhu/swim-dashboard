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
import city from '~~/store/data/address'
import {type ServiceCenter } from '@prisma/client'
import Datepicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"

useHead({
    title: "សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន",
});

let readOnly = checkIfPageReadOnly()
const route = useRoute()
const edit = route?.query?.id

// const compute = computed(() => route?.query?.id)
// watch(compute, async () => {
//    // window.location.reload()
//     navigateTo('/center?id' + route?.query?.id)
// })

const { data } = await useFetch<{ data: ServiceCenter[] }>('/api/center/get', {
    method: 'POST'
})

let serviceCenterList: any = []
data.value?.data.forEach(ele => {
    serviceCenterList.push({
        label: ele.nameKH,
        value: ele.id
    })
})

const config = useRuntimeConfig()
const toast = useToast()
const composableForm = useForm()
const formName = "center"
const formData: {
    [key: string]: any;
} = reactive({
    id: edit ? edit : 'asdf',
    status: true,
    fullNameKH : '',
    nickName : '',
    ReadableCode : '',
    IdentifyCode : '',
    Gender : '',
    DOB : '',
    POB : '',
    EducationLevel : '',
    Occupation : '',
    DateArrested : '',
    homeBA : '',
    StreetBA : '',
    villageBA : '',
    districtBA : '',
    commuteBA : '',
    cityProBA : '',
    FatherOrChaperoneName : '',
    FOCDOB : '',
    FOCMarried : '',
    FOCTelandAddress : '',
    MotherOrChaperoneName : '',
    MOCMarried : '',
    MOCDOB : '',
    MOCTelandAddress : '',
    OtherFamilyMembers : '',
    CloseFriend : '',
    ClientSendBy : '',
    ImportantChallenge : '',
    PastActivities : '',
    ReasonUseDrug : '',
    KnownLegalConsequence : '',
    typeDrugUsed : '',
    DrugVolumeUsed : '',
    DrugRequecyUse : '',
    DrugDurationUse : '',
    LivingSituation : '',
    UsedtoRehab : false,
    HowManyTimeHaveServed : '',
    ReasonComingtoCenter : '',
    DailyActivitiesInCenter : '',
    ActivitiesThatClientLike : '',
    ClientTalent : '',
    RelationshipWithFriends : '',
    RelationshipWithStaff : '',
    RelationshipWithTeacher : '',
    RelationshipWithOther : '',
    ConcernForClientFuture : '',
    HopeForClientFuture : '',
    FuturePlanforClient : '',
    FuturePlanforClientDetails : '',
    ClientFeelsHopless : false,
    ClientHoplessDetails : '',
    InterviewerOpinoin : '',
    InterviewerID : '',
    InterviewerisGovernStaff : true,
    InterViewDate : '',
    InterViewerSignature : '',
    governStaffID : '',
    StaffID : '',
    serviceCenterID : '',
})
const formRules = {
}
const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

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
    const oldImageURL = formData.photo
    let image: any
    image = await handleImageUpload()
    if (image) {
        formData.photo = image[0]
        //delete old profile from server storage
        await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
    }

    const { error } = await useFetch("/api/client_personalinformation/upsert", {
        method: "POST",
        body: JSON.stringify({
            id: formData.id,
            fullNameKH : formData.fullNameKH,
            IdentifyCode : formData.IdentifyCode,
            photo : formData.photo,
            nickName : formData.nickName,
            ReadableCode : formData.ReadableCode,
            Gender : formData.Gender,
            DOB : formData.DOB,
            POB : formData.POB,
            EducationLevel : formData.EducationLevel,
            Occupation : formData.Occupation,
            DateArrested : formData.DateArrested,
            homeBA : formData.homeBA,
            StreetBA : formData.StreetBA,
            villageBA : formData.villageBA,
            districtBA : formData.districtBA,
            commuteBA : formData.commuteBA,
            cityProBA : formData.cityProBA,
            FatherOrChaperoneName : formData.FatherOrChaperoneName,
            FOCDOB : formData.FOCDOB,
            FOCMarried : formData.FOCMarried,
            FOCTelandAddress : formData.FOCTelandAddress,
            MotherOrChaperoneName : formData.MotherOrChaperoneName,
            MOCMarried : formData.MOCMarried,
            MOCDOB : formData.MOCDOB,
            MOCTelandAddress : formData.MOCTelandAddress,
            OtherFamilyMembers : formData.OtherFamilyMembers,
            CloseFriend : formData.CloseFriend,
            ClientSendBy : formData.ClientSendBy,
            ImportantChallenge : formData.ImportantChallenge,
            PastActivities : formData.PastActivities,
            ReasonUseDrug : formData.ReasonUseDrug,
            KnownLegalConsequence : formData.KnownLegalConsequence,
            typeDrugUsed : formData.typeDrugUsed,
            DrugVolumeUsed : formData.DrugVolumeUsed,
            DrugRequecyUse : formData.DrugRequecyUse,
            DrugDurationUse : formData.DrugDurationUse,
            LivingSituation : formData.LivingSituation,
            UsedtoRehab : formData.UsedtoRehab,
            HowManyTimeHaveServed : formData.HowManyTimeHaveServed,
            ReasonComingtoCenter : formData.ReasonComingtoCenter,
            DailyActivitiesInCenter : formData.DailyActivitiesInCenter,
            ActivitiesThatClientLike : formData.ActivitiesThatClientLike,
            ClientTalent : formData.ClientTalent,
            RelationshipWithFriends : formData.RelationshipWithFriends,
            RelationshipWithStaff : formData.RelationshipWithStaff,
            RelationshipWithTeacher : formData.RelationshipWithTeacher,
            RelationshipWithOther : formData.RelationshipWithOther,
            ConcernForClientFuture : formData.ConcernForClientFuture,
            HopeForClientFuture : formData.HopeForClientFuture,
            FuturePlanforClient : formData.FuturePlanforClient,
            FuturePlanforClientDetails : formData.FuturePlanforClientDetails,
            ClientFeelsHopless : formData.ClientFeelsHopless,
            ClientHoplessDetails : formData.ClientHoplessDetails,
            InterviewerOpinoin : formData.InterviewerOpinoin,
            InterviewerID : formData.InterviewerID,
            InterviewerisGovernStaff : formData.InterviewerisGovernStaff,
            status : formData.status,
            InterViewDate : formData.InterViewDate,
            InterViewerSignature : formData.InterViewerSignature,
            governStaffID : formData.governStaffID,
            StaffID : formData.StaffID,
            serviceCenterID : formData.serviceCenterID,
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
    }
};

const clear = () => {
    if (readOnly) return;
    formData.status = false
    formData.IdentifyCode = null
    formData.photo = null
    files.value = null
    formData.id = null
    formData.fullNameKH = null
    formData.nickName = null
    formData.ReadableCode = null
    formData.Gender = null
    formData.DOB = null
    formData.POB = null
    formData.EducationLevel = null
    formData.Occupation = null
    formData.DateArrested = null
    formData.homeBA = null
    formData.StreetBA = null
    formData.villageBA = null
    formData.districtBA = null
    formData.commuteBA = null
    formData.cityProBA = null
    formData.FatherOrChaperoneName = null
    formData.FOCDOB = null
    formData.FOCMarried = null
    formData.FOCTelandAddress = null
    formData.MotherOrChaperoneName = null
    formData.MOCMarried = null
    formData.MOCDOB = null
    formData.MOCTelandAddress = null
    formData.OtherFamilyMembers = null
    formData.CloseFriend = null
    formData.ClientSendBy = null
    formData.ImportantChallenge = null
    formData.PastActivities = null
    formData.ReasonUseDrug = null
    formData.KnownLegalConsequence = null
    formData.typeDrugUsed = null
    formData.DrugVolumeUsed = null
    formData.DrugRequecyUse = null
    formData.DrugDurationUse = null
    formData.LivingSituation = null
    formData.UsedtoRehab = null
    formData.HowManyTimeHaveServed = null
    formData.ReasonComingtoCenter = null
    formData.DailyActivitiesInCenter = null
    formData.ActivitiesThatClientLike = null
    formData.ClientTalent = null
    formData.RelationshipWithFriends = null
    formData.RelationshipWithStaff = null
    formData.RelationshipWithTeacher = null
    formData.RelationshipWithOther = null
    formData.ConcernForClientFuture = null
    formData.HopeForClientFuture = null
    formData.FuturePlanforClient = null
    formData.FuturePlanforClientDetails = null
    formData.ClientFeelsHopless = null
    formData.ClientHoplessDetails = null
    formData.InterviewerOpinoin = null
    formData.InterviewerID = null
    formData.InterviewerisGovernStaff = null
    formData.status = null
    formData.InterViewDate = null
    formData.InterViewerSignature = null
    formData.governStaffID = null
    formData.StaffID = null
    formData.serviceCenterID = null

    setTimeout(() => {
        validator.value.clearErrors();
    }, 100);
};

const files = ref();
const handleImageUpload = async () => {
    if (readOnly) return;
    if (!files.value || files.value?.length == 0) return false;
    try {
        const fd = new FormData();
        Array.from(files.value).forEach((file, index) => {
            //@ts-ignore
            fd.append(index, file);
        });

        const { data } = await useFetch("/api/user/upload", {
            method: "POST",
            body: fd,
        });

        console.log("data from backend is ", data.value);
        return data.value
    } catch (error) {
        console.log(error);
    }
};


const commute = ref()
const temCommuteList: any = ref([])
const SelectedCityValue = computed(() => formData.cityProBA)

watch(SelectedCityValue, () => {
    temCommuteList.value = []
    commute.value = city.find((element: any) => {
        // console.log(element.name)
        return element.name === formData.cityProBA
    })?.ls.forEach((ele) => {
        temCommuteList.value.push({
            label: ele.bn,
            value: ele.bn,
            disabled: true,
        })
        ele.c.forEach((item => {
            temCommuteList.value.push({
                label: " ( " + item.cc + " ) " + item.cn,
                value: item.cn
            })
        }))
    })
})

// edit part
const userProfile = ref()
const currentUser = ref(false)

if (edit) {
    userProfile.value = await useFetch('/api/client_personalinformation/get', {
        method: 'post',
        body: JSON.stringify({
            id: edit
        })
    })

    formData.id = userProfile.value?.data?.id
    formData.photo = userProfile.value?.data?.photo
    formData.IdentifyCode = userProfile.value?.data?.IdentifyCode
    formData.fullNameKH = userProfile.value?.data?.fullNameKH
    formData.nickName = userProfile.value?.data?.nickName
    formData.ReadableCode = userProfile.value?.data?.ReadableCode
    formData.Gender = userProfile.value?.data?.Gender
    formData.DOB = userProfile.value?.data?.DOB
    formData.POB = userProfile.value?.data?.POB
    formData.EducationLevel = userProfile.value?.data?.EducationLevel
    formData.Occupation = userProfile.value?.data?.Occupation
    formData.DateArrested = userProfile.value?.data?.DateArrested
    formData.homeBA = userProfile.value?.data?.homeBA
    formData.StreetBA = userProfile.value?.data?.StreetBA
    formData.villageBA = userProfile.value?.data?.villageBA
    formData.districtBA = userProfile.value?.data?.districtBA
    formData.commuteBA = userProfile.value?.data?.commuteBA
    formData.cityProBA = userProfile.value?.data?.cityProBA
    formData.FatherOrChaperoneName = userProfile.value?.data?.FatherOrChaperoneName
    formData.FOCDOB = userProfile.value?.data?.FOCDOB
    formData.FOCMarried = userProfile.value?.data?.FOCMarried
    formData.FOCTelandAddress = userProfile.value?.data?.FOCTelandAddress
    formData.MotherOrChaperoneName = userProfile.value?.data?.MotherOrChaperoneName
    formData.MOCMarried = userProfile.value?.data?.MOCMarried
    formData.MOCDOB = userProfile.value?.data?.MOCDOB
    formData.MOCTelandAddress = userProfile.value?.data?.MOCTelandAddress
    formData.OtherFamilyMembers = userProfile.value?.data?.OtherFamilyMembers
    formData.CloseFriend = userProfile.value?.data?.CloseFriend
    formData.ClientSendBy = userProfile.value?.data?.ClientSendBy
    formData.ImportantChallenge = userProfile.value?.data?.ImportantChallenge
    formData.PastActivities = userProfile.value?.data?.PastActivities
    formData.ReasonUseDrug = userProfile.value?.data?.ReasonUseDrug
    formData.KnownLegalConsequence = userProfile.value?.data?.KnownLegalConsequence
    formData.typeDrugUsed = userProfile.value?.data?.typeDrugUsed
    formData.DrugVolumeUsed = userProfile.value?.data?.DrugVolumeUsed
    formData.DrugRequecyUse = userProfile.value?.data?.DrugRequecyUse
    formData.DrugDurationUse = userProfile.value?.data?.DrugDurationUse
    formData.LivingSituation = userProfile.value?.data?.LivingSituation
    formData.UsedtoRehab = userProfile.value?.data?.UsedtoRehab
    formData.HowManyTimeHaveServed = userProfile.value?.data?.HowManyTimeHaveServed
    formData.ReasonComingtoCenter = userProfile.value?.data?.ReasonComingtoCenter
    formData.DailyActivitiesInCenter = userProfile.value?.data?.DailyActivitiesInCenter
    formData.ActivitiesThatClientLike = userProfile.value?.data?.ActivitiesThatClientLike
    formData.ClientTalent = userProfile.value?.data?.ClientTalent
    formData.RelationshipWithFriends = userProfile.value?.data?.RelationshipWithFriends
    formData.RelationshipWithStaff = userProfile.value?.data?.RelationshipWithStaff
    formData.RelationshipWithTeacher = userProfile.value?.data?.RelationshipWithTeacher
    formData.RelationshipWithOther = userProfile.value?.data?.RelationshipWithOther
    formData.ConcernForClientFuture = userProfile.value?.data?.ConcernForClientFuture
    formData.HopeForClientFuture = userProfile.value?.data?.HopeForClientFuture
    formData.FuturePlanforClient = userProfile.value?.data?.FuturePlanforClient
    formData.FuturePlanforClientDetails = userProfile.value?.data?.FuturePlanforClientDetails
    formData.ClientFeelsHopless = userProfile.value?.data?.ClientFeelsHopless
    formData.ClientHoplessDetails = userProfile.value?.data?.ClientHoplessDetails
    formData.InterviewerOpinoin = userProfile.value?.data?.InterviewerOpinoin
    formData.InterviewerID = userProfile.value?.data?.InterviewerID
    formData.InterviewerisGovernStaff = userProfile.value?.data?.InterviewerisGovernStaff
    formData.status = userProfile.value?.data?.status
    formData.InterViewDate = userProfile.value?.data?.InterViewDate
    formData.InterViewerSignature = userProfile.value?.data?.InterViewerSignature
    formData.governStaffID = userProfile.value?.data?.governStaffID
    formData.StaffID = userProfile.value?.data?.StaffID
    formData.serviceCenterID = userProfile.value?.data?.serviceCenterID

    // //@ts-ignore
    // if(route?.query?.id === userDataAuth.value?.id){
    //   // console.log('current User')
    //   currentUser.value = true
    // }
}

let temCity: any = []

city.forEach(ele => {
    temCity.push({
        label: ele.name,
        value: ele.name
    })
})

const cityList = ref(temCity)

</script> 
<template>
    <div>
        <h2 class="text-2xl font-[Moul] text-primary"> {{ edit ? `១. សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន` : `១. សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន` }} </h2>
        <TwButton variant="danger" class="font-[battambang]" v-if="readOnly" :disabled="true">
            អ្ននគ្មានសិទ្ធកែប្រែ គណនីនេះទេ
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
                        <TwInput label="លេខសំគាល់" name="ReadableCode" v-model="formData.ReadableCode"
                            placeholder="លេខសំគាល់" type="text" />
                        <CustomErrorMessage name="ReadableCode" />
                    </div>
                <div class="col-span-12" >
                    <TwSelect                           
                      label="មជ្ឈមណ្ឌលព្យាបាលនិងស្តារនីតិសម្បទា"
                      name="serviceCenterID"            
                      v-model="formData.serviceCenterID"            
                      required                    
                      :items="serviceCenterList"
                      placeholder="សូមជ្រើសរើស"           
                    />
                    <CustomErrorMessage name="serviceCenterID" />            
                  </div> 
              <div class="col-span-3">
              </div>
              <div class="col-span-12   lg:col-span-5">          
                  <div class="vt-relative vt-col-span-12 lg:col-span-6  vt-flex vt-items-center vt-justify-center">
                    <div class="vt-relative vt-w-96">
                      <img :src="config.public.origin + '/' + (formData.photo ? formData.photo : '')"  :class="(files?.length > 0 ? ' hidden ' : ' ')" alt="">
                    </div>
                  </div>
                  <TwFile v-model="files" label="រូបភាព ៤x៦" />
                </div>
                <div class="col-span-4">
                </div>
                <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
                    <!-- <TwFeather type="map-pin" /> -->
                    <h1 class="text-lg font-[moul]"> I. ព័ត៌មាន​ អំពីអតិថិជន និងគ្រួសារ</h1>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="នាមត្រកូលនិងនាមខ្លួន" name="fullNameKH" v-model="formData.fullNameKH"
                        placeholder="នាមត្រកូលនិងនាមខ្លួន" type="text" />
                    <CustomErrorMessage name="fullNameKH" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ឈ្មោះហៅក្រៅ" name="nickName" v-model="formData.nickName"
                        placeholder="ឈ្មោះហៅក្រៅ" type="text" />
                    <CustomErrorMessage name="nickName" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខកូដ" name="IdentifyCode" v-model="formData.IdentifyCode"
                        placeholder="លេខកូដ" type="text" />
                    <CustomErrorMessage name="IdentifyCode" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                  <TwSelect                           
                    label="ភេទ"
                    name="Gender"            
                    v-model="formData.Gender"            
                    required                    
                    :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                    placeholder="សូមជ្រើសរើស"           
                  />
                  <CustomErrorMessage name="Gender" />            
                </div>  
                 <div class="col-span-12 lg:col-span-6">
                  <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                  <ClientOnly>
                  <Datepicker
                    v-model="formData.DOB"
                    :dayNames="[
                        'Mo',
                        'Tu',
                        'We',
                        'Th',
                        'Fr',
                        'Sa',
                        'Su',
                    ]"
                    position="left"
                    required
                    :maxDate="new Date()"
                    :enableTimePicker="false"></Datepicker>
                    </ClientOnly> 

                  <CustomErrorMessage name="DateofBirth" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ទីកន្លែងកំណើត" name="POB" v-model="formData.POB"
                        placeholder="ទីកន្លែងកំណើត" type="text" />
                    <CustomErrorMessage name="POB" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="កំរិតវប្បធម៌ថ្នាកទី" name="EducationLevel" v-model="formData.EducationLevel"
                        placeholder="កំរិតវប្បធម៌ថ្នាកទី" type="text" />
                    <CustomErrorMessage name="EducationLevel" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មុខរបរ (បើមាន)" name="Occupation" v-model="formData.Occupation"
                        placeholder="មុខរបរ (បើមាន)" type="text" />
                    <CustomErrorMessage name="Occupation" />
                </div>
                <div class="col-span-12">
                    <TwInput label="កាលបរិច្ឆេទចូលមជ្ឈមណ្ឌលឬ ឃាត់ខ្លួន" name="DateArrested" v-model="formData.DateArrested"
                        placeholder="កាលបរិច្ឆេទចូលមជ្ឈមណ្ឌលឬ ឃាត់ខ្លួន" type="text" />
                    <CustomErrorMessage name="DateArrested" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាសយដ្ឋាន មុនពេលចាប់ខ្លួន ឬចូលមណ្ឌល៖" name="homeBA" v-model="formData.homeBA" placeholder="ផ្ទះលេខ"
                        type="text" />
                    <CustomErrorMessage name="homeBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ផ្លូវលេខ" name="StreetBA" v-model="formData.StreetBA" placeholder="ផ្លូវលេខ"
                        type="text" />
                    <CustomErrorMessage name="StreetBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ភូមិ-ក្រុម" name="villageBA" v-model="formData.villageBA" placeholder="ភូមិ-ក្រុម"
                        type="text" />
                    <CustomErrorMessage name="villageBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect :disabled="readOnly" label="រាជធានី/ខេត្ត" name="cityProBA" v-model="formData.cityProBA" required
                        :items="cityList" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="type" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label for="" class=" font-bold">
                        ឃុំ/សង្កាត់
                    </label>
                    <ClientOnly>
                        <USelect :disabled="readOnly" name="city"  required v-model="formData.districtBA"
                            :options="temCommuteList" placeholder="សូមជ្រើសរើស" size="lg" />
                    </ClientOnly>
                    <CustomErrorMessage name="type" />
                </div>
                 <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ស្រុក-ខណ្ឌ" name="commuteBA" v-model="formData.commuteBA" placeholder="ស្រុក-ខណ្ឌ"
                        type="text" />
                    <CustomErrorMessage name="commuteBA" />
                </div>

                <div class="col-span-12 flex justify-end gap-1 ">
                    <UButton :disabled="readOnly" color="gray" type="button" square size="lg"
                        class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clear()">
                        កំណត់ឡើងវិញ
                    </UButton>
                    <UButton color="primary" type="submit" size="lg" class="px-4" :disabled="readOnly"> រក្សាទុក </UButton>
                </div>
            </TwForm>
        </div>
    </div>
</template>
