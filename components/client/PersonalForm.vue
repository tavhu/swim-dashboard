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
import { type ServiceCenter } from '@prisma/client'
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
    fullNameKH: '',
    ClientHopelessMultiple: [],
    nickName: '',
    ReadableCode: '',
    IdentifyCode: '',
    Gender: '',
    DOB: '',
    POB: '',
    EducationLevel: '',
    Occupation: '',
    DateArrested: '',
    homeBA: '',
    StreetBA: '',
    villageBA: '',
    districtBA: '',
    commuteBA: '',
    cityProBA: '',
    FatherOrChaperoneName: '',
    FOCDOB: '',
    FOCTel: '',
    FOCMarried: '',
    FOCTelandAddress: '',
    MotherOrChaperoneName: '',
    MOCMarried: '',
    MOCDOB: '',
    MOCTel: '',
    MOCTelandAddress: '',
    OtherFamilyMembers: '',
    CloseFriend: '',
    ClientSendBy: '',
    ImportantChallenge: '',
    PastActivities: '',
    ReasonUseDrug: '',
    ReasonUseDrugOther: '',
    KnownLegalConsequence: '',
    typeDrugUsed: '',
    typeDrugUsedOther: '',
    DrugVolumeUsed: '',
    DrugRequecyUse: '',
    DrugDurationUse: '',
    LivingSituation: '',
    UsedtoRehab: false,
    HowManyTimeHaveServed: '',
    ReasonComingtoCenter: '',
    DailyActivitiesInCenter: '',
    ActivitiesThatClientLike: '',
    ClientTalent: '',
    RelationshipWithFriends: '',
    RelationshipWithStaff: '',
    RelationshipWithTeacher: '',
    RelationshipWithOther: '',
    ConcernForClientFuture: '',
    HopeForClientFuture: '',
    FuturePlanforClient: '',
    FuturePlanforClientDetails: '',
    ClientFeelsHopless: false,
    ClientHoplessDetails: '',
    InterviewerOpinoin: '',
    InterviewerID: '',
    InterviewerisGovernStaff: true,
    InterViewDate: '',
    InterViewerSignature: '',
    governStaffID: '',
    StaffID: '',
    serviceCenterID: '',
})
const formRules = {
}
const isError = ref(false);
const form = computed(() => composableForm.getForm(formName));
const validator = computed(() => form.value.validator);

const ClientHopelessMultiple = ref(Array(
    {
        value: 'signDepression',
        check: false,
        label: 'មានសញ្ញានៃជម្ងឺផ្លូវចិត្ត'
    },
    {
        value: 'ForcetoConfess',
        check: false,
        label: 'ទទួលការបង្ខិតបង្ខំឲ្យសារភាពកំហុស'
    },
    {
        value: 'servingmoretimethanrequired',
        check: false,
        label: 'ឃុំខ្លួនលើសរយៈពេលកំណត់ដោយច្បាប់'
    },
    {
        value: 'wronglImprison',
        check: false,
        label: 'ត្រូវបានឃាត ឬឃុំខ្លួនដោយខុសច្បាប់'
    },
    {
        value: 'NovisitedFromFamily',
        check: false,
        label: 'មិនមានការសួរសុខទុក្ខពីគ្រូសារ'
    },
    {
        value: 'ViolentlyArrested',
        check: false,
        label: 'ត្រូវបានធ្វើបាបនៅពេលឃាត់'
    },
    {
        value: 'other',
        check: false,
        label: 'បញ្ហាផ្សេងៗទៀត'
    },
))
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
            fullNameKH: formData.fullNameKH,
            IdentifyCode: formData.IdentifyCode,
            photo: formData.photo,
            nickName: formData.nickName,
            ReadableCode: formData.ReadableCode,
            Gender: formData.Gender,
            DOB: formData.DOB,
            POB: formData.POB,
            EducationLevel: formData.EducationLevel,
            Occupation: formData.Occupation,
            DateArrested: formData.DateArrested,
            homeBA: formData.homeBA,
            StreetBA: formData.StreetBA,
            villageBA: formData.villageBA,
            districtBA: formData.districtBA,
            commuteBA: formData.commuteBA,
            cityProBA: formData.cityProBA,
            FatherOrChaperoneName: formData.FatherOrChaperoneName,
            FOCDOB: formData.FOCDOB,
            FOCTel: formData.FOCTel,
            FOCMarried: formData.FOCMarried,
            FOCTelandAddress: formData.FOCTelandAddress,
            MotherOrChaperoneName: formData.MotherOrChaperoneName,
            MOCMarried: formData.MOCMarried,
            MOCDOB: formData.MOCDOB,
            MOCTel: formData.MOCTel,
            ClientHopelessMultiple: ClientHopelessMultiple.value,
            MOCTelandAddress: formData.MOCTelandAddress,
            OtherFamilyMembers: formData.OtherFamilyMembers,
            CloseFriend: formData.CloseFriend,
            ClientSendBy: formData.ClientSendBy,
            ImportantChallenge: formData.ImportantChallenge,
            PastActivities: formData.PastActivities,
            ReasonUseDrug: formData.ReasonUseDrug,
            ReasonUseDrugOther: formData.ReasonUseDrugOther,
            KnownLegalConsequence: formData.KnownLegalConsequence,
            typeDrugUsed: formData.typeDrugUsed,
            typeDrugUsedOther: formData.typeDrugUsedOther,
            DrugVolumeUsed: formData.DrugVolumeUsed,
            DrugRequecyUse: formData.DrugRequecyUse,
            DrugDurationUse: formData.DrugDurationUse,
            LivingSituation: formData.LivingSituation,
            UsedtoRehab: formData.UsedtoRehab,
            HowManyTimeHaveServed: formData.HowManyTimeHaveServed,
            ReasonComingtoCenter: formData.ReasonComingtoCenter,
            DailyActivitiesInCenter: formData.DailyActivitiesInCenter,
            ActivitiesThatClientLike: formData.ActivitiesThatClientLike,
            ClientTalent: formData.ClientTalent,
            RelationshipWithFriends: formData.RelationshipWithFriends,
            RelationshipWithStaff: formData.RelationshipWithStaff,
            RelationshipWithTeacher: formData.RelationshipWithTeacher,
            RelationshipWithOther: formData.RelationshipWithOther,
            ConcernForClientFuture: formData.ConcernForClientFuture,
            HopeForClientFuture: formData.HopeForClientFuture,
            FuturePlanforClient: formData.FuturePlanforClient,
            FuturePlanforClientDetails: formData.FuturePlanforClientDetails,
            ClientFeelsHopless: formData.ClientFeelsHopless,
            ClientHoplessDetails: formData.ClientHoplessDetails,
            InterviewerOpinoin: formData.InterviewerOpinoin,
            InterviewerID: formData.InterviewerID,
            InterviewerisGovernStaff: formData.InterviewerisGovernStaff,
            status: formData.status,
            InterViewDate: formData.InterViewDate,
            InterViewerSignature: formData.InterViewerSignature,
            governStaffID: formData.governStaffID,
            StaffID: formData.StaffID,
            serviceCenterID: formData.serviceCenterID,
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
    formData.FOCTel = null
    formData.FOCMarried = null
    formData.FOCTelandAddress = null
    formData.MotherOrChaperoneName = null
    formData.MOCMarried = null
    formData.MOCDOB = null
    formData.MOCTel = null
    formData.MOCTelandAddress = null
    formData.OtherFamilyMembers = null
    formData.CloseFriend = null
    formData.ClientSendBy = null
    formData.ImportantChallenge = null
    formData.PastActivities = null
    formData.ReasonUseDrug = null
    formData.ReasonUseDrugOther = null
    formData.KnownLegalConsequence = null
    formData.typeDrugUsed = null
    formData.typeDrugUsedOther = null
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
    formData.FOCTel = userProfile.value?.data?.FOCTel
    formData.FOCMarried = userProfile.value?.data?.FOCMarried
    formData.FOCTelandAddress = userProfile.value?.data?.FOCTelandAddress
    formData.MotherOrChaperoneName = userProfile.value?.data?.MotherOrChaperoneName
    formData.MOCMarried = userProfile.value?.data?.MOCMarried
    formData.MOCDOB = userProfile.value?.data?.MOCDOB
    formData.MOCTel = userProfile.value?.data?.MOCTel
    formData.MOCTelandAddress = userProfile.value?.data?.MOCTelandAddress
    formData.OtherFamilyMembers = userProfile.value?.data?.OtherFamilyMembers
    formData.CloseFriend = userProfile.value?.data?.CloseFriend
    formData.ClientSendBy = userProfile.value?.data?.ClientSendBy
    formData.ImportantChallenge = userProfile.value?.data?.ImportantChallenge
    formData.PastActivities = userProfile.value?.data?.PastActivities
    formData.ReasonUseDrug = userProfile.value?.data?.ReasonUseDrug
    formData.ReasonUseDrugOther = userProfile.value?.data?.ReasonUseDrugOther
    formData.KnownLegalConsequence = userProfile.value?.data?.KnownLegalConsequence
    formData.typeDrugUsed = userProfile.value?.data?.typeDrugUsed
    formData.typeDrugUsedOther = userProfile.value?.data?.typeDrugUsedOther
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
    ClientHopelessMultiple.value = userProfile.value?.data?.ClientHopelessMultiple
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

const districtBAPick = () => {
    let index = temCommuteList.value.findIndex((ele: any) => ele.value === formData.districtBA)
    console.log(index)
    let ttt = true
    while (ttt) {
        index--
        if (temCommuteList.value[index]?.disabled) {
            ttt = false
            formData.commuteBA = temCommuteList.value[index]?.value
        }

    }
}


const LegalConsequence = [{
    value: false,
    label: 'មិនដឹង',
},
{
    value: true,
    label: 'ដឹង',
},
]
const ClientFeelsHopless = [{
    value: false,
    label: 'ធម្មតា',
},
{
    value: true,
    label: 'បាក់ទឹកចិត្ត',
},
]

const LivingSituationOption = [{
    value: 'rural',
    label: 'ជនបទ',
},
{
    value: 'Anarchy',
    label: 'តំបន់អនាធិបតេយ្យ',
},
{
    value: 'Crowded',
    label: 'ទីប្រជុំជន',
},
{
    value: 'thief',
    label: 'តំបន់ចោរកម្ម',
},
{
    value: 'wealthy',
    label: 'តំបន់អ្នកមាន',
},
{
    value: 'frequentviolent',
    label: 'តបន់អំពើហឹង្សាញឹកញាប់',
},
{
    value: 'gangArea',
    label: 'តំបន់ ក្រុមបងធំ',
},
{
    value: 'DrugArea',
    label: 'តំបន់ប្រើប្រាស់គ្រឿងញៀន',
},
{
    value: 'PoorArea',
    label: 'តំបន់អ្នកក្រ',
},
]


const ClientServeHistory = ref(Array({
    nameCenterorPrison: '',
    DateTimeServed: '',
}))

const ClientProgress = ref(Array({
    NoteDateTime: '',
    Details: '',
}))
</script> 
<template>
    <div>
        <h2 class="text-2xl font-[Moul] text-primary"> {{ edit ? `១. សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន` : `១.
            សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន` }} </h2>
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
                    <TwInput label="លេខសំគាល់" name="ReadableCode" v-model="formData.ReadableCode" placeholder="លេខសំគាល់"
                        type="text" />
                    <CustomErrorMessage name="ReadableCode" />
                </div>
                <div class="col-span-12">
                    <TwSelect label="មជ្ឈមណ្ឌលព្យាបាលនិងស្តារនីតិសម្បទា" name="serviceCenterID"
                        v-model="formData.serviceCenterID" required :items="serviceCenterList" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="serviceCenterID" />
                </div>
                <div class="col-span-3">
                </div>
                <div class="col-span-12   lg:col-span-5">
                    <div class="vt-relative vt-col-span-12 lg:col-span-6  vt-flex vt-items-center vt-justify-center">
                        <div class="vt-relative vt-w-96">
                            <img :src="config.public.origin + '/' + (formData.photo ? formData.photo : '')"
                                :class="(files?.length > 0 ? ' hidden ' : ' ')" alt="">
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
                    <TwInput label="១.នាមត្រកូលនិងនាមខ្លួន" name="fullNameKH" v-model="formData.fullNameKH"
                        placeholder="នាមត្រកូលនិងនាមខ្លួន" type="text" />
                    <CustomErrorMessage name="fullNameKH" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ឈ្មោះហៅក្រៅ" name="nickName" v-model="formData.nickName" placeholder="ឈ្មោះហៅក្រៅ"
                        type="text" />
                    <CustomErrorMessage name="nickName" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខកូដ" name="IdentifyCode" v-model="formData.IdentifyCode" placeholder="លេខកូដ"
                        type="text" />
                    <CustomErrorMessage name="IdentifyCode" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect label="ភេទ" name="Gender" v-model="formData.Gender" required
                        :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                        placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="Gender" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                    <ClientOnly>
                        <Datepicker v-model="formData.DOB" :dayNames="[
                            'Mo',
                            'Tu',
                            'We',
                            'Th',
                            'Fr',
                            'Sa',
                            'Su',
                        ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                    </ClientOnly>

                    <CustomErrorMessage name="DateofBirth" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ទីកន្លែងកំណើត" name="POB" v-model="formData.POB" placeholder="ទីកន្លែងកំណើត"
                        type="text" />
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
                    <TwInput label="អាសយដ្ឋាន មុនពេលចាប់ខ្លួន ឬចូលមណ្ឌល៖" name="homeBA" v-model="formData.homeBA"
                        placeholder="ផ្ទះលេខ" type="text" />
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
                    <TwSelect :disabled="readOnly" label="រាជធានី/ខេត្ត" name="cityProBA" v-model="formData.cityProBA"
                        required :items="cityList" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="type" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label for="" class=" font-bold">
                        ឃុំ/សង្កាត់
                    </label>
                    <ClientOnly>
                        <USelect :disabled="readOnly" @change="districtBAPick()" name="districtBA" required
                            v-model="formData.districtBA" :options="temCommuteList" placeholder="សូមជ្រើសរើស" size="lg" />
                    </ClientOnly>
                    <CustomErrorMessage name="districtBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ស្រុក-ខណ្ឌ" name="commuteBA" v-model="formData.commuteBA" placeholder="ស្រុក-ខណ្ឌ"
                        type="text" />
                    <CustomErrorMessage name="commuteBA" />
                </div>
                <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
                    <h1 class="text-lg"> 2. ស្ថានភាពគ្រួសាររបស់អតិថិជន</h1>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ឈ្មោះឪពុក-អ្នកថែទាំ" name="FatherOrChaperoneName"
                        v-model="formData.FatherOrChaperoneName" placeholder="ឈ្មោះឪពុក-អ្នកថែទាំ" type="text" />
                    <CustomErrorMessage name="FatherOrChaperoneName" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ឈ្មោះម្តាយ-អ្នកថែទាំ" name="MotherOrChaperoneName"
                        v-model="formData.MotherOrChaperoneName" placeholder="ឈ្មោះម្តាយ-អ្នកថែទាំ" type="text" />
                    <CustomErrorMessage name="MotherOrChaperoneName" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                    <ClientOnly>
                        <Datepicker v-model="formData.FOCDOB" :dayNames="[
                            'Mo',
                            'Tu',
                            'We',
                            'Th',
                            'Fr',
                            'Sa',
                            'Su',
                        ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                    </ClientOnly>

                    <CustomErrorMessage name="DateofBirth" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                    <ClientOnly>
                        <Datepicker v-model="formData.MOCDOB" :dayNames="[
                            'Mo',
                            'Tu',
                            'We',
                            'Th',
                            'Fr',
                            'Sa',
                            'Su',
                        ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                    </ClientOnly>

                    <CustomErrorMessage name="DateofBirth" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាពាហ៍ពិពាហ៍" name="FOCMarried" v-model="formData.FOCMarried" placeholder="អាពាហ៍ពិពាហ៍"
                        type="text" />
                    <CustomErrorMessage name="FOCMarried" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាពាហ៍ពិពាហ៍" name="MOCMarried" v-model="formData.MOCMarried" placeholder="អាពាហ៍ពិពាហ៍"
                        type="text" />
                    <CustomErrorMessage name="MOCMarried" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខទូរស័ព្ទ" name="FOCTel" v-model="formData.FOCTel" placeholder="លេខទូរស័ព្ទ"
                        type="text" />
                    <CustomErrorMessage name="FOCTel" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខទូរស័ព្ទ" name="FOCTelandAddress" v-model="formData.FOCTelandAddress"
                        placeholder="លេខទូរស័ព្ទ" type="text" />
                    <CustomErrorMessage name="FOCTelandAddress" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាសយដ្ឋាន" name="FOCTel" v-model="formData.FOCTel" placeholder="អាសយដ្ឋាន"
                        type="text" />
                    <CustomErrorMessage name="FOCTel" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាសយដ្ឋាន" name="MOCTelandAddress" v-model="formData.MOCTelandAddress"
                        placeholder="អាសយដ្ឋាន" type="text" />
                    <CustomErrorMessage name="MOCTelandAddress" />
                </div>
                <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
                    <h1 class="text-lg"> 3. សេចក្តីពណ៌នាអំពីអតិថិជន និងទំនាក់ទំនងជាមួយបុគ្គលនានា</h1>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="សមាជិកគ្រួសារដ៏ទៃផ្សេងទៀត" name="OtherFamilyMembers"
                        v-model="formData.OtherFamilyMembers" placeholder="សមាជិកគ្រួសារដ៏ទៃផ្សេងទៀត" type="text" />
                    <CustomErrorMessage name="OtherFamilyMembers" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មិត្តភក្តជិតស្និត" name="CloseFriend" v-model="formData.CloseFriend"
                        placeholder="មិត្តភក្តជិតស្និត" type="text" />
                    <CustomErrorMessage name="CloseFriend" />
                </div>
                <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
                    <h1 class="text-lg font-[moul]"> II. ស្ថានភាពរបស់អតិថិជន</h1>
                </div>
                <div class="col-span-12 ">
                    <TwInput label="១.អតិថិជនត្រូវបានបញ្ជូនដោយ" name="ClientSendBy" v-model="formData.ClientSendBy"
                        placeholder="អតិថិជនត្រូវបានបញ្ជូនដោយ" type="text" />
                    <CustomErrorMessage name="ClientSendBy" />
                </div>
                <div class="col-span-12 ">
                    <TwInput label="២.បញ្ហាប្រឈមដោយសំខាន់ៗ" name="ImportantChallenge" v-model="formData.ImportantChallenge"
                        placeholder="បញ្ហាប្រឈមដោយសំខាន់ៗ" type="text" />
                    <CustomErrorMessage name="ImportantChallenge" />
                </div>
                <div class="col-span-12 ">
                    <TwInput label="៣.សកម្មភាពធ្លាប់បានប្រព្រឹត្ត" name="PastActivities" v-model="formData.PastActivities"
                        placeholder="សកម្មភាពធ្លាប់បានប្រព្រឹត្ត" type="text" />
                    <CustomErrorMessage name="PastActivities" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect label="ហេតុដែលនាំមានការប្រើប្រាស់គ្រឿងញៀន" name="ReasonUseDrug"
                        v-model="formData.ReasonUseDrug" required :items="[{ value: 'Fun', label: 'ដើម្បីសប្បាយ' }, { value: 'followFriend', label: 'ធ្វើតាមមិត្តភក្តិ' },
                        { value: 'forceUse', label: 'មានគេបង្ខំ' }, { value: 'try', label: 'ចង់សាក' }, { value: 'familyBroken', label: 'បែកបាក់គ្រួសារ' },
                        { value: 'other', label: 'មូលហេតុផ្សេង' }
                        ]" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="ReasonUseDrug" />
                </div>
                <div v-if="formData.ReasonUseDrug == 'other'" class="col-span-12 lg:col-span-6">
                    <TwInput label="មូលហេតុផ្សេង" name="ReasonUseDrugOther" required v-model="formData.ReasonUseDrugOther"
                        placeholder="មូលហេតុផ្សេង" type="text" />
                    <CustomErrorMessage name="ReasonUseDrugOther" />
                </div>
                <div class="col-span-12">
                    <label class="">តើអ្នកដឹងទេថា អំពើដែលអ្នកធ្វើជាអំពើដែលនាំមកនូវគ្រោះថ្នាក់និងខុសច្បាប់</label>
                    <URadio class="font-[battambang] inline-flex ml-5 font-medium"
                        v-for="(methods, index) of LegalConsequence" :key="index" v-model="formData.KnownLegalConsequence"
                        v-bind="methods" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect label="ប្រភេទគ្រឿងញៀនធ្លាប់ប្រើប្រាស់" name="typeDrugUsed" v-model="formData.typeDrugUsed"
                        required :items="[{ value: 'SmileGlue', label: 'ហិតកាវ' }, { value: 'yama', label: 'យ៉ាមា-យ៉ាបា' },
                        { value: 'heroin', label: 'ហេរ៉ូអុីន' }, { value: 'cocain', label: 'កូកាអុីន' }, { value: 'smoking', label: 'ជក់បារី' },
                        { value: 'drinking', label: 'ផឹកស្រា' }, { value: 'other', label: 'ផ្សេង' }
                        ]" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="typeDrugUsed" />
                </div>
                <div v-if="formData.typeDrugUsed == 'other'" class="col-span-12 lg:col-span-6">
                    <TwInput label="ប្រភេទគ្រឿងញៀនធ្លាប់ប្រើប្រាស់ផ្សេង" name="typeDrugUsedOther" required
                        v-model="formData.typeDrugUsedOther" placeholder="ប្រភេទគ្រឿងញៀនធ្លាប់ប្រើប្រាស់ផ្សេង"
                        type="text" />
                    <CustomErrorMessage name="typeDrugUsedOther" />
                </div>
                <div class="col-span-12 lg:col-span-4">
                    <TwInput label="បរិមាណប្រើប្រាស់" name="DrugVolumeUsed" required v-model="formData.DrugVolumeUsed"
                        placeholder="បរិមាណប្រើប្រាស់" type="text" />
                    <CustomErrorMessage name="DrugVolumeUsed" />
                </div>
                <div class="col-span-12 lg:col-span-4">
                    <TwInput label="ភាពញឹកញាប់" name="DrugRequecyUse" required v-model="formData.DrugRequecyUse"
                        placeholder="ភាពញឹកញាប់" type="text" />
                    <CustomErrorMessage name="DrugRequecyUse" />
                </div>
                <div class="col-span-12 lg:col-span-4">
                    <TwInput label="រយៈពេលប្រើប្រាស់" name="DrugDurationUse" required v-model="formData.DrugDurationUse"
                        placeholder="រយៈពេលប្រើប្រាស់" type="text" />
                    <CustomErrorMessage name="DrugDurationUse" />
                </div>
                <div class="col-span-12">
                    <label class="text-lg">៥. បរិស្ថាននៃការរស់នៅ</label>
                    <URadio class="font-[battambang] inline-flex ml-5 font-medium"
                        v-for="(methods, index) of LivingSituationOption" :key="index" v-model="formData.LivingSituation"
                        v-bind="methods" />
                </div>
                <div class="col-span-12">
                    <h1 class="text-lg">៦. ការចូលមកស្នាក់នៅ</h1>
                    <h1 class="text-lg"> តើអ្នកធ្លាប់បានរស់នៅក្នុងមជ្ឈមណ្ឌល ឬពន្ធនាគារណាខ្លះដែរឬទេ មុននឹងចូលមកមជ្ឈមណ្ឌលនេះ?
                    </h1>
                    <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1  items-end "
                        v-for="(child, index) in ClientServeHistory" :key="index">
                        <div>
                            <TwInput label="ឈ្មោះមជ្ឈមណ្ឌល ឬពន្ធនាគារ៖" name="nameCenterorPrison" required
                                v-model="child.nameCenterorPrison" placeholder="ឈ្មោះមជ្ឈមណ្ឌល ឬពន្ធនាគារ៖" type="text" />
                            <CustomErrorMessage name="nameCenterorPrison" />
                        </div>
                        <div>
                            <label for="">ថ្ងៃខែ</label>
                            <Datepicker v-model="child.DateTimeServed" :dayNames="[
                                'Mo',
                                'Tu',
                                'We',
                                'Th',
                                'Fr',
                                'Sa',
                                'Su',
                            ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                        </div>
                        <div>
                            <div class="col-span-12">
                                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                                    @click="ClientServeHistory.splice(index, 1)"> លុបព័ត៌មានកូន </UButton>
                            </div>
                        </div>
                    </div>
                    <div class="col-span-12 mt-2">
                        <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="ClientServeHistory.push({
                            nameCenterorPrison: '',
                            DateTimeServed: '',
                        })"> បន្ថែមព័ត៌មាន </UButton>
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="តើអ្នកចូលមករស់នៅក្នុងមជ្ឈមណ្ឌលនេះលើកទីប៉ុន្មាន?" name="HowManyTimeHaveServed" required
                        v-model="formData.HowManyTimeHaveServed" placeholder="ចំនួន" type="text" />
                    <CustomErrorMessage name="HowManyTimeHaveServed" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មូលហេតុនៃការនាំចូលមករស់នៅក្នុងមជ្ឈមណ្ឌល៖" name="ReasonComingtoCenter" required
                        v-model="formData.ReasonComingtoCenter" placeholder="មូលហេតុ" type="text" />
                    <CustomErrorMessage name="ReasonComingtoCenter" />
                </div>
                <div class="col-span-12">
                    <h1 class="text-lg "> ៧. រៀបរាប់ត្រួសៗ អំពីសម្មភាព និងកាលវិភាគប្រចាំថ្ងៃរបស់អតិថិជន៖</h1>
                </div>
                <div class="col-span-12">
                    <TwTextarea label="សកម្មភាពនៅក្នុងមណ្ឌល" name="DailyActivitiesInCenter" required class="h-[5rem]"
                        v-model="formData.DailyActivitiesInCenter" placeholder="" type="text" />
                    <CustomErrorMessage name="DailyActivitiesInCenter" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="សកម្មភាពនៅក្នុងមជ្ឈមណ្ឌល ដែលអតិថិជនចូលចិត្តបំផុត៖" name="ActivitiesThatClientLike"
                        required v-model="formData.ActivitiesThatClientLike" placeholder="" type="text" />
                    <CustomErrorMessage name="ActivitiesThatClientLike" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អតិថិជនមានទេពកោសល្យខាង" name="ClientTalent" required v-model="formData.ClientTalent"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="ClientTalent" />
                </div>
                <div class="col-span-12">
                    <h1 class="text-lg "> ៨. ការទំនាក់ទំនង របស់អតិថិជនក្នុងមជ្ឈមណ្ឌល៖</h1>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មិត្តភក្តិ៖" name="RelationshipWithFriends" required
                        v-model="formData.RelationshipWithFriends" placeholder="" type="text" />
                    <CustomErrorMessage name="RelationshipWithFriends" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="បុគ្គលិក" name="RelationshipWithStaff" required v-model="formData.RelationshipWithStaff"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="RelationshipWithStaff" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="គ្រូបណ្តុះបណ្តាល" name="RelationshipWithTeacher" required
                        v-model="formData.RelationshipWithTeacher" placeholder="" type="text" />
                    <CustomErrorMessage name="RelationshipWithTeacher" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អ្នកផ្សេងទៀត(សូមរៀបរាប់)" name="RelationshipWithOther" required
                        v-model="formData.RelationshipWithOther" placeholder="" type="text" />
                    <CustomErrorMessage name="RelationshipWithOther" />
                </div>
                <div class="col-span-12">
                    <TwTextarea label="៩.កង្វល់ និងការភ័យខ្លាចរបស់អតិថិជនទាក់ទងនឹងអនាគតរបស់ខ្លួន៖"
                        name="ConcernForClientFuture" required class="h-[5rem]" v-model="formData.ConcernForClientFuture"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="ConcernForClientFuture" />
                </div>
                <div class="col-span-12">
                    <TwTextarea label="១០.គោលបំណង និងសេចក្តីសង្ឃឹមរបស់អតិថិជនសម្រាប់អនាគតរបស់ខ្លួន"
                        name="HopeForClientFuture" required class="h-[5rem]" v-model="formData.HopeForClientFuture"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="HopeForClientFuture" />
                </div>

                <div class="col-span-12 lg:col-span-6">
                    <TwSelect label="១១. ផែនការក្នុងអនាគតដែលបានស្នើឡើង៖" name="FuturePlanforClient"
                        v-model="formData.FuturePlanforClient" required :items="[
                            { value: 'sentClientTo', label: 'បញ្ជូនអតិថិជនទៅ' }, { value: 'Educated', label: 'អប់រំ ឬបណ្តុះបណ្តាលវិជ្ជាជីវៈ៖' },
                            { value: 'consultant', label: 'ផ្តល់ការពិគ្រោះបញ្ហា/ពិគ្រោះយោបល់៖' }, { value: 'sentToHospital', label: 'បញ្ចូនទៅសេវាព្យាបាល៖' },
                            { value: 'other', label: 'ផែនការផ្សេងៗទៀត' },

                        ]" placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="FuturePlanforClient" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ផែនការក្នុងអនាគតដែលបានស្នើឡើង រៀបរាប់លំអិត" name="FuturePlanforClientDetails" required
                        v-model="formData.FuturePlanforClientDetails" placeholder="រៀបរាប់លំអិត" type="text" />
                    <CustomErrorMessage name="FuturePlanforClientDetails" />
                </div>
                <div class="col-span-12">
                    <h1 class="text-lg "> ១២.តើអតិថិជនរបស់អ្នកមានបញ្ហាអ្វីខ្លះ</h1>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <label class="">អតិថិជនធ្លាក់ទឹកចិត្តខ្លាំង (ឧ.ចង់ធ្វើឃាត ប្រើជាតិពុល ប្រើគ្រឿងញៀន ។ល។)</label>
                    <URadio class="font-[battambang] inline-flex ml-5 font-medium"
                        v-for="(methods, index) of ClientFeelsHopless" :key="index" v-model="formData.ClientFeelsHopless"
                        v-bind="methods" />
                </div>
                <div v-if="formData.ClientFeelsHopless" class="col-span-12 lg:col-span-6">
                    <TwInput label="ពត៌មានបន្ថែម" name="ClientHoplessDetails" required
                        v-model="formData.ClientHoplessDetails" placeholder="រៀបរាប់លំអិត" type="text" />
                    <CustomErrorMessage name="ClientHoplessDetails" />
                </div>
                <div class="col-span-12 mt-5 font-[battambang] inline-flex  gap-2 ml-5 text-lg">
                    <UCheckbox v-for="(item, index) of ClientHopelessMultiple" :key="index" v-model="item.check"
                        :name="item.value" :label="item.label" />
                </div>

                <div class="col-span-12">
                    <TwTextarea
                        label="១៣. តាមរយៈការសំភាសន៍របស់អ្នកជាមួយអតិថិជន តើអ្នកយល់ឃើញដូចយ៉ាងណាអំពីស្ថានភាពរបស់អតិថិជន?"
                        name="InterviewerOpinoin" required class="h-[5rem]" v-model="formData.InterviewerOpinoin"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="InterviewerOpinoin" />
                </div>
                <div class="col-span-12 flex justify-start gap-3 mt-5 mb-5">
                    <h1 class="text-lg font-[moul]"> III. កំណត់ត្រាអំពីការរីកចម្រើន</h1>
                </div>
                <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1  items-end "
                    v-for="(child, index) in ClientProgress" :key="index">
                    <div>
                        <label for="">កាលបរិច្ចេទ</label>
                        <Datepicker v-model="child.NoteDateTime" :dayNames="[
                            'Mo',
                            'Tu',
                            'We',
                            'Th',
                            'Fr',
                            'Sa',
                            'Su',
                        ]" position="left" required :maxDate="new Date()" :enableTimePicker="false">
                        </Datepicker>
                    </div>
                    <div>
                        <TwInput label="ការអភិវឌ្ឍន៍សំខាន់ៗ/សេវាដែលបានផ្តល់ឱ្យអតិថិជន" name="nameCenterorPrison" required
                            v-model="child.Details" placeholder="ការអភិវឌ្ឍន៍សំខាន់ៗ/សេវាដែលបានផ្តល់" type="text" />
                        <CustomErrorMessage name="nameCenterorPrison" />
                    </div>
                    <div>
                        <div class="col-span-12">
                            <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                                @click="ClientProgress.splice(index, 1)"> លុបព័ត៌មានកូន </UButton>
                        </div>
                    </div>
                </div>
                <div class="col-span-12 mt-2">
                    <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="ClientProgress.push({
                        NoteDateTime: '',
                        Details: '',
                    })"> បន្ថែមព័ត៌មាន </UButton>
                </div>

                <div>
                    ឈ្មោះមន្ត្រីឬបុគ្គលិកសង្គមកិច្ច៖
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
