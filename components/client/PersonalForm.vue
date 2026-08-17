<script setup lang="ts">
import {
    TwForm,
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
import addressData from '~~/store/data/gazetteers';
import { type ServiceCenter } from '@prisma/client'
import Datepicker from "@vuepic/vue-datepicker"

useHead({
    title: "សំណុំឯកសារផ្ទាល់ខ្លួនរបស់អតិថិជន",
});

const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const { data: token } = await useFetch("/api/token", { headers });
const ClientRegister = useClientRegisterSaved()

const prop = defineProps<{
    readOnly: boolean,
    id: string | undefined | null,
}>()

// console.log(prop.id)

// const edit = ref(prop.id) //'cls8m4kxp000rnqlidfpfw5rb'  //  //route?.query?.id
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
const saving = ref(false)
const config = useRuntimeConfig()
const toast = useToast()
const { uploadFiles } = useFileUpload()
const composableForm = useForm()
const formName = "clientPersonalInformation"
const formData: {
    [key: string]: any;
} = reactive({
    id: prop.id ? prop.id : 'asdf',
    status: true,
    fullNameKH: '',
    photo: '',
    ClientHopelessMultiple: [],
    nickName: '',
    ReadableCode: '',
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
    communeBA: '',
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
    KnownLegalConsequence: null,
    typeDrugUsed: '',
    typeDrugUsedOther: '',
    DrugVolumeUsed: '',
    DrugRequecyUse: '',
    DrugDurationUse: '',
    LivingSituation: '',
    UsedtoRehab: null,
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
    InterViewDate: '',
    InterViewerSignature: '',
    InterviewerPosition: '',
    serviceCenterID: '',
})
// One entry per non-nullable column on Client_PersonalInformation, so the form
// refuses to submit what the database would reject. This was `{}`, which meant
// validator.validate() passed everything and the `required` attributes on the
// inputs were decorative — the first sign of a missing field was a failed save.
//
// `required` here treats false as present and only rejects undefined, '' and
// null.
//
// Four required columns are deliberately absent: KnownLegalConsequence,
// LivingSituation, UsedtoRehab and InterViewDate. TwForm has no :data binding,
// so the validator only sees fields from components that register themselves
// with it — the vue3-tailwind ones. Those four use URadio (@nuxt/ui) and
// Datepicker (@vuepic/vue-datepicker), which never register, so a rule on them
// reports "required" no matter what the user picks. They are checked against
// formData directly in submit() instead.
// The interviewer is whoever is signed in. This used to be attempted with a
// hidden input whose :value read token.id while its v-model wrote formData —
// so the id was rendered but never stored, and every record saved with an empty
// InterviewerID. Set it directly instead.
watchEffect(() => {
    const id = (token.value as any)?.id
    if (id && !formData.InterviewerID) formData.InterviewerID = id
})

// Field names as they read on screen. The validator's own message is just
// "1 error occured", which tells the interviewer nothing about which of the
// seventy-odd fields to look at.
const FIELD_LABELS: Record<string, string> = {
    fullNameKH: '១.នាមត្រកូលនិងនាមខ្លួន',
    nickName: 'ឈ្មោះហៅក្រៅ',
    Gender: 'ភេទ',
    POB: 'ទីកន្លែងកំណើត',
    homeBA: 'ផ្ទះលេខ',
    StreetBA: 'ផ្លូវលេខ',
    villageBA: 'ភូមិ-ក្រុម',
    districtBA: 'ស្រុក-ខណ្ឌ',
    communeBA: 'ឃុំ/សង្កាត់',
    cityProBA: 'រាជធានី/ខេត្ត',
    ClientSendBy: '១.អតិថិជនត្រូវបានបញ្ជូនដោយ',
    ImportantChallenge: '២.បញ្ហាប្រឈមដោយសំខាន់ៗ',
    PastActivities: '៣.សកម្មភាពធ្លាប់បានប្រព្រឹត្ត',
    ReasonUseDrug: 'ហេតុដែលនាំមានការប្រើប្រាស់គ្រឿងញៀន',
    typeDrugUsed: 'ប្រភេទគ្រឿងញៀនធ្លាប់ប្រើប្រាស់',
    DrugVolumeUsed: 'បរិមាណប្រើប្រាស់',
    DrugRequecyUse: 'ភាពញឹកញាប់',
    DrugDurationUse: 'រយៈពេលប្រើប្រាស់',
    serviceCenterID: 'មជ្ឈមណ្ឌលព្យាបាលនិងស្តារនីតិសម្បទា',
}

const formRules = {
    fullNameKH: ['required'],
    nickName: ['required'],
    Gender: ['required'],
    POB: ['required'],
    homeBA: ['required'],
    StreetBA: ['required'],
    villageBA: ['required'],
    districtBA: ['required'],
    communeBA: ['required'],
    cityProBA: ['required'],
    ClientSendBy: ['required'],
    ImportantChallenge: ['required'],
    PastActivities: ['required'],
    ReasonUseDrug: ['required'],
    typeDrugUsed: ['required'],
    DrugVolumeUsed: ['required'],
    DrugRequecyUse: ['required'],
    DrugDurationUse: ['required'],
    serviceCenterID: ['required'],
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
    // if (readOnly) return;
    // console.log('123')
    if (!(await confirmDialog())) return;
    // Fields the validator cannot see — see the note on formRules. Checked
    // against formData directly so the message names what is actually missing.
    const unregisteredRequired: Record<string, string> = {
        KnownLegalConsequence: 'តើអ្នកដឹងទេថា អំពើដែលអ្នកធ្វើជាអំពើដែលនាំមកនូវគ្រោះថ្នាក់និងខុសច្បាប់',
        LivingSituation: 'បរិស្ថាននៃការរស់នៅ',
        UsedtoRehab: 'ធ្លាប់ចូលមជ្ឈមណ្ឌល ឬទទួលសេវាប្រហាក់ប្រហែលពីមុន',
        InterViewDate: 'កាលបរិច្ឆេទសម្ភាសន៍',
        InterviewerID: 'មន្ត្រីសម្ភាសន៍ (ចូលប្រើប្រាស់ម្តងទៀត)',
    }
    // `false` is a valid answer on the radios, so only null/undefined/'' count
    // as unanswered.
    const unanswered = Object.entries(unregisteredRequired)
        .filter(([field]) => {
            const v = formData[field]
            return v === null || v === undefined || v === ''
        })
        .map(([, label]) => label)

    if (unanswered.length) {
        toast.error({ message: 'សូមបំពេញ៖ ' + unanswered.join(' / ') });
        isError.value = true;
        setTimeout(() => { isError.value = false; }, 1000);
        return;
    }

    validator.value.clearErrors();
    await validator.value.validate();
    if (validator.value.fail()) {
        const failed: string[] = validator.value.getFailedFields?.() ?? [];
        toast.error({
            message: failed.length
                ? 'សូមបំពេញ៖ ' + failed.map((f) => FIELD_LABELS[f] ?? f).join(' / ')
                : validator.value.getErrorMessage(),
        });
        isError.value = true;
        setTimeout(() => {
            isError.value = false;
        }, 1000);
        return true;
    }
    saving.value = true
    const oldImageURL = formData.photo
    let image: any
    try {
        image = await handleImageUpload()
    } catch (e) {
        // Saving here would store the record with the previous photo, or
        // none, while telling the user it worked.
        saving.value = false
        toast.error({ message: "មិនអាចផ្ទុករូបភាពបានទេ៖ " + (e as any)?.message })
        return
    }
    if (image) {
        formData.photo = image[0]
        //delete old profile from server storage
        await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
    }

    const form_data = {
        id: formData.id,
        fullNameKH: formData.fullNameKH,
        photo: formData.photo,
        nickName: formData.nickName,
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
        communeBA: formData.communeBA,
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
        status: formData.status,
        InterViewDate: formData.InterViewDate,
        InterViewerSignature: formData.InterViewerSignature,
        InterviewerPosition: formData.InterviewerPosition,
        serviceCenterID: formData.serviceCenterID,
        ClientProgress: prop.id ? ClientProgress.value.map(item => ({ ...item, Client_PersonalInformationID: prop.id })) : ClientProgress.value,
        ClientServeHistory: prop?.id ? ClientServeHistory.value.map(item => ({ ...item, Client_PersonalInformationID: prop.id })) : ClientServeHistory.value,
        ClientHopelessMultiple: prop?.id ? ClientHopelessMultiple.value.map(item => ({ ...item, client_PersonalInformationId: prop.id })) : ClientHopelessMultiple.value,
    }
    const { data: saved, error } = await useFetch<any>(prop.id ? "/api/client/personalInformationUpdate" : "/api/client/personalInformation", {
        method: "POST",
        body: JSON.stringify(form_data),
    });

    // The client number is issued by the database on insert, so show the one it
    // actually assigned rather than leaving the field blank.
    if (!prop.id && saved.value?.ReadableCode) {
        formData.ReadableCode = saved.value.ReadableCode
    }

    if (error.value?.statusCode) {
        ClientRegister.value = false
        toast.error({
            message: "មិនជោគជ័យ",
        });
    } else {
        toast.success({
            message: "ជោគជ័យ",
        });
        ClientRegister.value = true
    }
    saving.value = false
};

const files = ref();
// Errors deliberately propagate — see composables/useFileUpload.ts. The caller
// aborts the save rather than storing a record whose image silently went
// missing.
const handleImageUpload = async () => {
    if (prop.readOnly) return;
    return await uploadFiles(files.value);
}

// edit part
const userProfile = ref()
const currentUser = ref(false)

const LegalConsequence = [{
    value: false,
    label: 'មិនដឹង',
},
{
    value: true,
    label: 'ដឹង',
},
]
// UsedtoRehab is a required Boolean in the schema but had no control anywhere
// in the template, so every record saved with whatever the initial value was.
// The manual asks for it explicitly: ធ្លាប់ចូលមជ្ឈមណ្ឌល ឬទទួលសេវាប្រហាក់ប្រហែលពីមុន.
const UsedtoRehabOption = [{
    value: false,
    label: 'មិនធ្លាប់',
},
{
    value: true,
    label: 'ធ្លាប់',
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

const LivingSituationOption = ref(Array({
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
        value: 'wealthy',
        label: 'តំបន់អ្នកមាន',
    },
    {
        value: 'PoorArea',
        label: 'តំបន់ក្រីក្រ',
    }
))


const ClientServeHistory = ref(Array({
    nameCenterorPrison: '',
    DateTimeServed: '',
}))

const ClientProgress = ref(Array({
    NoteDateTime: '',
    Details: '',
}))

// Removing the last row leaves nothing to type into and makes the section look
// unavailable, so a blank one takes its place — the same rule ServiceRowsField
// follows on ទម្រង់ទី៣-៦.
const removeServeHistory = (index: number) => {
    ClientServeHistory.value.splice(index, 1)
    if (!ClientServeHistory.value.length) {
        ClientServeHistory.value.push({ nameCenterorPrison: '', DateTimeServed: '' })
    }
}
const removeProgress = (index: number) => {
    ClientProgress.value.splice(index, 1)
    if (!ClientProgress.value.length) {
        ClientProgress.value.push({ NoteDateTime: '', Details: '' })
    }
}

// if (prop.id) {
//     userProfile.value = await useFetch('/api/client/personalInformationGet', {
//         method: 'post',
//         body: JSON.stringify({
//             id: prop.id
//         })
//     })

//     formData.id = userProfile.value?.data?.id
//     formData.photo = userProfile.value?.data?.photo
//     formData.fullNameKH = userProfile.value?.data?.fullNameKH
//     formData.nickName = userProfile.value?.data?.nickName
//     formData.ReadableCode = userProfile.value?.data?.ReadableCode
//     formData.Gender = userProfile.value?.data?.Gender
//     formData.DOB = userProfile.value?.data?.DOB
//     formData.POB = userProfile.value?.data?.POB
//     formData.EducationLevel = userProfile.value?.data?.EducationLevel
//     formData.Occupation = userProfile.value?.data?.Occupation
//     formData.DateArrested = userProfile.value?.data?.DateArrested
//     formData.homeBA = userProfile.value?.data?.homeBA
//     formData.StreetBA = userProfile.value?.data?.StreetBA
//     formData.villageBA = userProfile.value?.data?.villageBA
//     formData.districtBA = userProfile.value?.data?.districtBA
//     formData.communeBA = userProfile.value?.data?.communeBA
//     formData.cityProBA = userProfile.value?.data?.cityProBA
//     formData.FatherOrChaperoneName = userProfile.value?.data?.FatherOrChaperoneName
//     formData.FOCDOB = userProfile.value?.data?.FOCDOB
//     formData.FOCTel = userProfile.value?.data?.FOCTel
//     formData.FOCMarried = userProfile.value?.data?.FOCMarried
//     formData.FOCTelandAddress = userProfile.value?.data?.FOCTelandAddress
//     formData.MotherOrChaperoneName = userProfile.value?.data?.MotherOrChaperoneName
//     formData.MOCMarried = userProfile.value?.data?.MOCMarried
//     formData.MOCDOB = userProfile.value?.data?.MOCDOB
//     formData.MOCTel = userProfile.value?.data?.MOCTel
//     formData.MOCTelandAddress = userProfile.value?.data?.MOCTelandAddress
//     formData.OtherFamilyMembers = userProfile.value?.data?.OtherFamilyMembers
//     formData.CloseFriend = userProfile.value?.data?.CloseFriend
//     formData.ClientSendBy = userProfile.value?.data?.ClientSendBy
//     formData.ImportantChallenge = userProfile.value?.data?.ImportantChallenge
//     formData.PastActivities = userProfile.value?.data?.PastActivities
//     formData.ReasonUseDrug = userProfile.value?.data?.ReasonUseDrug
//     formData.ReasonUseDrugOther = userProfile.value?.data?.ReasonUseDrugOther
//     formData.KnownLegalConsequence = userProfile.value?.data?.KnownLegalConsequence
//     formData.typeDrugUsed = userProfile.value?.data?.typeDrugUsed
//     formData.typeDrugUsedOther = userProfile.value?.data?.typeDrugUsedOther
//     formData.DrugVolumeUsed = userProfile.value?.data?.DrugVolumeUsed
//     formData.DrugRequecyUse = userProfile.value?.data?.DrugRequecyUse
//     formData.DrugDurationUse = userProfile.value?.data?.DrugDurationUse
//     formData.LivingSituation = userProfile.value?.data?.LivingSituation
//     formData.UsedtoRehab = userProfile.value?.data?.UsedtoRehab
//     formData.HowManyTimeHaveServed = userProfile.value?.data?.HowManyTimeHaveServed
//     formData.ReasonComingtoCenter = userProfile.value?.data?.ReasonComingtoCenter
//     formData.DailyActivitiesInCenter = userProfile.value?.data?.DailyActivitiesInCenter
//     formData.ActivitiesThatClientLike = userProfile.value?.data?.ActivitiesThatClientLike
//     formData.ClientTalent = userProfile.value?.data?.ClientTalent
//     formData.RelationshipWithFriends = userProfile.value?.data?.RelationshipWithFriends
//     formData.RelationshipWithStaff = userProfile.value?.data?.RelationshipWithStaff
//     formData.RelationshipWithTeacher = userProfile.value?.data?.RelationshipWithTeacher
//     formData.RelationshipWithOther = userProfile.value?.data?.RelationshipWithOther
//     formData.ConcernForClientFuture = userProfile.value?.data?.ConcernForClientFuture
//     formData.HopeForClientFuture = userProfile.value?.data?.HopeForClientFuture
//     formData.FuturePlanforClient = userProfile.value?.data?.FuturePlanforClient
//     formData.FuturePlanforClientDetails = userProfile.value?.data?.FuturePlanforClientDetails
//     ClientHopelessMultiple.value = userProfile.value?.data?.ClientHopelessMultiple
//     formData.ClientFeelsHopless = userProfile.value?.data?.ClientFeelsHopless
//     formData.ClientHoplessDetails = userProfile.value?.data?.ClientHoplessDetails
//     formData.InterviewerOpinoin = userProfile.value?.data?.InterviewerOpinoin
//     formData.InterviewerID = userProfile.value?.data?.InterviewerID
//     formData.status = userProfile.value?.data?.status
//     formData.InterViewDate = userProfile.value?.data?.InterViewDate
//     formData.InterViewerSignature = userProfile.value?.data?.InterViewerSignature
//     formData.InterviewerPosition = userProfile.value?.data?.InterviewerPosition
//     formData.serviceCenterID = userProfile.value?.data?.serviceCenterID
//     ClientServeHistory.value = userProfile.value?.data?.ClientServeHistory
//     ClientProgress.value = userProfile?.value?.data?.ClientProgress

//     // //@ts-ignore
//     // if(route?.query?.id === userDataAuth.value?.id){
//     //   // console.log('current User')
//     //   currentUser.value = true
//     // }
//     ClientRegister.value = true
// }

// --- START: Address Dropdown Logic (Corrected for Villages) ---


// This onMounted hook ensures that the data fetching and processing are handled correctly
// after the component is mounted.
onMounted(async () => {
    isLoading.value = true;
    if (prop.id) {
        // $fetch, not useFetch: useFetch is a setup-time composable and silently
        // did nothing here — no request for the record was ever made, so the
        // edit form opened blank.
        let userProfile: any = null;
        try {
            userProfile = await $fetch('/api/client/personalInformationGet', {
                method: 'POST',
                body: { id: prop.id },
            });
        } catch (e: any) {
            toast.error({ message: 'មិនអាចទាញយកព័ត៌មានអតិថិជនបានទេ' });
        }

        if (userProfile?.id) {
            // Assign all data to formData
            Object.assign(formData, userProfile);

            // Manually populate dropdown lists based on the loaded data
            if (formData.cityProBA) {
                districtList.value = findDistrictsByProvince(formData.cityProBA);
            }
            if (formData.cityProBA && formData.districtBA) {
                communeList.value = findCommunesByDistrict(formData.cityProBA, formData.districtBA);
            }
            if (formData.cityProBA && formData.districtBA && formData.communeBA) {
                villageList.value = findVillagesByCommune(formData.cityProBA, formData.districtBA, formData.communeBA);
            }

            // The repeatable sections and the difficulties checklist are their own
            // refs, not part of formData, so the Object.assign above never reached
            // them and they opened blank on every edit.
            //
            // `id` is deliberately dropped: the update endpoint deletes these rows
            // and recreates them from the body, so the stored ids are stale by the
            // time they would be written back.
            if (userProfile.ClientServeHistory?.length) {
                ClientServeHistory.value = userProfile.ClientServeHistory.map((h: any) => ({
                    nameCenterorPrison: h.nameCenterorPrison ?? '',
                    DateTimeServed: h.DateTimeServed ?? '',
                }));
            }
            if (userProfile.ClientProgress?.length) {
                ClientProgress.value = userProfile.ClientProgress.map((c: any) => ({
                    NoteDateTime: c.NoteDateTime ?? '',
                    Details: c.Details ?? '',
                }));
            }
            if (userProfile.ClientHopelessMultiple?.length) {
                // Keep the component's own option list — it carries the labels and
                // the full set of choices — and only restore which were ticked.
                const ticked = new Set(
                    userProfile.ClientHopelessMultiple.filter((h: any) => h.check).map((h: any) => h.value)
                );
                ClientHopelessMultiple.value = ClientHopelessMultiple.value.map((o: any) => ({
                    ...o,
                    check: ticked.has(o.value),
                }));
            }
        }
        ClientRegister.value = true;
    }
    // Vue watchers flush on the next tick, not during Object.assign. Releasing
    // the guard synchronously here would let the cascade callbacks run with it
    // already false, and they would clear the district, commune and village
    // that were just loaded. Wait for them to flush first.
    await nextTick();
    isLoading.value = false;
});

const isLoading = ref(true); // Guard to prevent watchers firing on initial load

const provinceList = computed(() => {
    return addressData.map(province => ({
        label: province.name.km,
        value: province.code,
    }));
});

const districtList = ref<DropdownItem[]>([]);
const communeList = ref<DropdownItem[]>([]);
const villageList = ref<DropdownItem[]>([]); // For the village dropdown

const findDistrictsByProvince = (provinceName: string) => {
    const province = addressData.find(p => p.code === provinceName);
    return province?.districts.values.map(d => ({ label: d.name.km, value: d.code })) || [];
};

const findCommunesByDistrict = (provinceName: string, districtName: string) => {
    const province = addressData.find(p => p.code === provinceName);
    const district = province?.districts.values.find(d => d.code === districtName);
    return district?.communes.values.map(c => ({ label: c.name.km, value: c.code })) || [];
};

// Corrected function to find villages
const findVillagesByCommune = (provinceName: string, districtName: string, communeName: string) => {
    const province = addressData.find(p => p.code === provinceName);
    if (!province) return [];
    const district = province.districts.values.find(d => d.code === districtName);
    if (!district) return [];
    const commune = district.communes.values.find(c => c.code === communeName);
    // The correct property for the village list is 'd' and for the name is 'vn'
    return commune?.villages.values?.map(village => ({ label: village.name.km, value: village.code })) || [];
};



// Watch for changes in the Province dropdown (cityProBA)
watch(() => formData.cityProBA, (newProvince) => {
    // Assigning a loaded record must not look like the user changing the
    // parent dropdown, which clears everything below it.
    if (isLoading.value) return;

    formData.districtBA = '';
    formData.communeBA = '';
    formData.villageBA = '';
    districtList.value = [];
    communeList.value = [];
    villageList.value = []; // Clear village list

    if (newProvince) {
        districtList.value = findDistrictsByProvince(newProvince);
    }
}, { immediate: true });

// districtBA holds the district (ស្រុក-ខណ្ឌ), communeBA the commune
// (ឃុំ/សង្កាត់). The template and these watchers used to hold them the other way
// round while the edit-loading code above used this one, so reopening a saved
// client built its dropdowns from the wrong columns.
watch(() => formData.districtBA, (newDistrict) => {
    // Assigning a loaded record must not look like the user changing the
    // parent dropdown, which clears everything below it.
    if (isLoading.value) return;

    formData.communeBA = '';
    formData.villageBA = '';
    communeList.value = [];
    villageList.value = []; // Clear village list

    if (newDistrict && formData.cityProBA) {
        communeList.value = findCommunesByDistrict(formData.cityProBA, newDistrict);
    }
}, { immediate: true });

watch(() => formData.communeBA, (newCommune) => {
    // Assigning a loaded record must not look like the user changing the
    // parent dropdown, which clears everything below it.
    if (isLoading.value) return;

    formData.villageBA = '';
    villageList.value = []; // Clear village list

    if (newCommune && formData.cityProBA && formData.districtBA) {
        villageList.value = findVillagesByCommune(formData.cityProBA, formData.districtBA, newCommune);
    }
}, { immediate: true });

// --- END: Address Dropdown Logic (Corrected for Villages) ---
</script>
<template>
    <div class="font-[Battambang]">
        <div class="mt-5">
            <!-- Same header row as ទម្រង់ទី២-៦: title left, the way back right. The
                 spinner overlay is gone — the save button carries :loading, which is
                 how every other form reports it. -->
            <div class="flex items-start justify-between gap-4">
                <h2 class="text-2xl font-[Moul] text-primary">
                    {{ prop.id ? 'កែសម្រួលសំណុំឯកសារអតិថិជន' : 'ចុះឈ្មោះអតិថិជន' }}
                </h2>
                <NuxtLink :to="prop.id ? `/client/id/${prop.id}` : '/client'">
                    <UButton color="gray" size="xl" type="button">
                        <span class="font-[Moul] text-lg">ត្រឡប់ក្រោយ</span>
                    </UButton>
                </NuxtLink>
            </div>
            <hr class="my-2 border dark:border-gray-700" />

            <p v-if="readOnly"
                class="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-base text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                អ្នកគ្មានសិទ្ធិកែប្រែទម្រង់នេះទេ។
            </p>

            <TwForm :name="formName" class="grid grid-cols-12 items-start gap-4" :class="{ 'tw-shake': isError }"
                :rules="formRules" @submit="submit">
                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">ព័ត៌មានលំអិត</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
                <!-- <div class="col-span-12">
                    {{
                        formData }}
                </div> -->
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខសំគាល់" name="ReadableCode" v-model="formData.ReadableCode" disabled
                        :placeholder="prop.id ? '' : 'បង្កើតដោយប្រព័ន្ធ'" type="text" />
                    <CustomErrorMessage name="ReadableCode" />
                </div>
                <div class="col-span-12">
                    <TwSelect label="មជ្ឈមណ្ឌលព្យាបាលនិងស្តារនីតិសម្បទា" name="serviceCenterID"
                        v-model="formData.serviceCenterID" required :items="serviceCenterList"
                        placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="serviceCenterID" />
                </div>
                <!-- The photo sits beside the two identifiers rather than under an
                     empty spacer column, and uses the same picker as every other
                     upload in the app — narrowed to images, single-valued, because
                     a client has one photograph. TwFile is gone: its drop zone read
                     "SELECT OR DROP FILE HERE" in English while ទម្រង់ទី២-៥ said it
                     in Khmer. -->
                <div class="col-span-12 lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">រូបថត ៤x៦</span>
                    <div class="mt-1 flex items-start gap-4">
                        <img v-if="formData.photo && !(files?.length > 0)"
                            :src="config.public.origin + '/' + formData.photo" alt=""
                            class="h-28 w-24 shrink-0 rounded border object-cover dark:border-gray-700" />
                        <div class="min-w-0 flex-1">
                            <AttachmentField v-model:pending="files" :read-only="readOnly" label=""
                                :multiple="false" accept="image/jpeg,image/png,image/webp,image/gif"
                                accept-label="JPG, PNG, WEBP, GIF" />
                        </div>
                    </div>
                </div>
                    </div>
                </section>

                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">I. ព័ត៌មាន​ អំពីអតិថិជន និងគ្រួសារ</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
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
                    <TwSelect label="ភេទ" name="Gender" v-model="formData.Gender" required
                        :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                        placeholder="សូមជ្រើសរើស" />
                    <CustomErrorMessage name="Gender" />
                </div>
                <label class="col-span-12 block lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">ថ្ងៃខែឆ្នាំកំណើត</span>
                    <Datepicker v-model="formData.DOB" :disabled="readOnly" :maxDate="new Date()"
                        :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                </label>
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
                <label class="col-span-12 block lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">កាលបរិច្ឆេទចូលមជ្ឈមណ្ឌល</span>
                    <Datepicker v-model="formData.DateArrested" :disabled="readOnly" :enableTimePicker="false"
                        format="dd/MM/yyyy" autoApply class="mt-1" />
                </label>
                <!-- START: Corrected Address Fields -->
                    <div class="col-span-12">
                        <h4 class="mt-2 text-lg font-[Moul] text-primary">អាសយដ្ឋានបច្ចុប្បន្ន</h4>
                        <hr class="my-2 border dark:border-gray-700" />
                    </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ផ្ទះលេខ" name="homeBA" v-model="formData.homeBA" placeholder="ផ្ទះលេខ"
                        type="text" />
                    <CustomErrorMessage name="homeBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="ផ្លូវលេខ" name="StreetBA" v-model="formData.StreetBA" placeholder="ផ្លូវលេខ"
                        type="text" />
                    <CustomErrorMessage name="StreetBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect :disabled="readOnly" label="រាជធានី/ខេត្ត" name="cityProBA" v-model="formData.cityProBA"
                        :items="provinceList" placeholder="សូមជ្រើសរើស" required />
                    <CustomErrorMessage name="cityProBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect :disabled="readOnly || !formData.cityProBA" label="ស្រុក-ខណ្ឌ" name="districtBA"
                        v-model="formData.districtBA" :items="districtList" placeholder="សូមជ្រើសរើស" required />
                    <CustomErrorMessage name="districtBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect :disabled="readOnly || !formData.districtBA" label="ឃុំ/សង្កាត់" name="communeBA"
                        v-model="formData.communeBA" :items="communeList" placeholder="សូមជ្រើសរើស" required />
                    <CustomErrorMessage name="communeBA" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwSelect :disabled="readOnly || !formData.communeBA" label="ភូមិ-ក្រុម" name="villageBA"
                        v-model="formData.villageBA" :items="villageList" placeholder="សូមជ្រើសរើស" required />
                    <CustomErrorMessage name="villageBA" />
                </div>

                <!-- END: Corrected Address Fields -->

                    </div>
                </section>

                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">២. ស្ថានភាពគ្រួសាររបស់អតិថិជន</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
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
                <label class="col-span-12 block lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">ថ្ងៃខែឆ្នាំកំណើត (ឪពុក-អ្នកថែទាំ)</span>
                    <Datepicker v-model="formData.FOCDOB" :disabled="readOnly" :maxDate="new Date()"
                        :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                </label>
                <label class="col-span-12 block lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">ថ្ងៃខែឆ្នាំកំណើត (ម្តាយ-អ្នកថែទាំ)</span>
                    <Datepicker v-model="formData.MOCDOB" :disabled="readOnly" :maxDate="new Date()"
                        :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                </label>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាពាហ៍ពិពាហ៍" name="FOCMarried" v-model="formData.FOCMarried"
                        placeholder="អាពាហ៍ពិពាហ៍" type="text" />
                    <CustomErrorMessage name="FOCMarried" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាពាហ៍ពិពាហ៍" name="MOCMarried" v-model="formData.MOCMarried"
                        placeholder="អាពាហ៍ពិពាហ៍" type="text" />
                    <CustomErrorMessage name="MOCMarried" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខទូរស័ព្ទ" name="FOCTel" v-model="formData.FOCTel" placeholder="លេខទូរស័ព្ទ"
                        type="text" />
                    <CustomErrorMessage name="FOCTel" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="លេខទូរស័ព្ទ" name="FOCTelandAddress" v-model="formData.MOCTel"
                        placeholder="លេខទូរស័ព្ទ" type="text" />
                    <CustomErrorMessage name="FOCTelandAddress" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាសយដ្ឋាន" name="FOCTel" v-model="formData.FOCTelandAddress" placeholder="អាសយដ្ឋាន"
                        type="text" />
                    <CustomErrorMessage name="FOCTel" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="អាសយដ្ឋាន" name="MOCTelandAddress" v-model="formData.MOCTelandAddress"
                        placeholder="អាសយដ្ឋាន" type="text" />
                    <CustomErrorMessage name="MOCTelandAddress" />
                </div>
                    </div>
                </section>

                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">៣. សេចក្តីពណ៌នាអំពីអតិថិជន និងទំនាក់ទំនងជាមួយបុគ្គលនានា</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
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
                    </div>
                </section>

                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">II. ស្ថានភាពរបស់អតិថិជន</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 ">
                    <TwInput label="១.អតិថិជនត្រូវបានបញ្ជូនដោយ" name="ClientSendBy" v-model="formData.ClientSendBy"
                        placeholder="អតិថិជនត្រូវបានបញ្ជូនដោយ" type="text" />
                    <CustomErrorMessage name="ClientSendBy" />
                </div>
                <div class="col-span-12 ">
                    <TwInput label="២.បញ្ហាប្រឈមដោយសំខាន់ៗ" name="ImportantChallenge"
                        v-model="formData.ImportantChallenge" placeholder="បញ្ហាប្រឈមដោយសំខាន់ៗ" type="text" />
                    <CustomErrorMessage name="ImportantChallenge" />
                </div>
                <div class="col-span-12 ">
                    <TwInput label="៣.សកម្មភាពធ្លាប់បានប្រព្រឹត្ត" name="PastActivities"
                        v-model="formData.PastActivities" placeholder="សកម្មភាពធ្លាប់បានប្រព្រឹត្ត" type="text" />
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
                    <TwInput label="មូលហេតុផ្សេង" name="ReasonUseDrugOther" required
                        v-model="formData.ReasonUseDrugOther" placeholder="មូលហេតុផ្សេង" type="text" />
                    <CustomErrorMessage name="ReasonUseDrugOther" />
                </div>
                <div class="col-span-12">
                    <span class="text-sm text-gray-500 dark:text-gray-400">តើអ្នកដឹងទេថា អំពើដែលអ្នកធ្វើជាអំពើដែលនាំមកនូវគ្រោះថ្នាក់និងខុសច្បាប់</span>
                    <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                        <URadio v-for="(opt, index) of LegalConsequence" :key="index" v-model="formData.KnownLegalConsequence"
                            v-bind="opt" :disabled="readOnly" class="font-[Battambang]" />
                    </div>
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
                    <span class="text-sm text-gray-500 dark:text-gray-400">៥. បរិស្ថាននៃការរស់នៅ</span>
                    <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                        <URadio v-for="(opt, index) of LivingSituationOption" :key="index" v-model="formData.LivingSituation"
                            v-bind="opt" :disabled="readOnly" class="font-[Battambang]" />
                    </div>
                </div>
                <div class="col-span-12">
                    <h4 class="mt-2 text-lg font-[Moul] text-primary">៦. ការចូលមកស្នាក់នៅ</h4>
                    <hr class="my-2 border dark:border-gray-700" />
                    <p class="mb-3 text-base text-gray-600 dark:text-gray-300">
                        តើអ្នកធ្លាប់បានរស់នៅក្នុងមជ្ឈមណ្ឌល ឬពន្ធនាគារណាខ្លះដែរឬទេ មុននឹងចូលមកមជ្ឈមណ្ឌលនេះ?
                    </p>
                    <div class="space-y-3">
                        <div v-for="(child, index) in ClientServeHistory" :key="index"
                            class="grid grid-cols-1 items-end gap-3 rounded-lg border p-3 dark:border-gray-700 sm:grid-cols-12">
                            <div class="sm:col-span-1">
                                <span class="text-sm text-gray-500 dark:text-gray-400">ល.រ</span>
                                <p class="mt-1 h-10 text-base leading-10 text-gray-800 dark:text-gray-100">
                                    {{ index + 1 }}
                                </p>
                            </div>
                            <label class="block sm:col-span-6">
                                <span class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះមជ្ឈមណ្ឌល ឬពន្ធនាគារ</span>
                                <input v-model="child.nameCenterorPrison" :disabled="readOnly" type="text"
                                    placeholder="ឈ្មោះមជ្ឈមណ្ឌល ឬពន្ធនាគារ"
                                    class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
                            </label>
                            <label class="block sm:col-span-3">
                                <span class="text-sm text-gray-500 dark:text-gray-400">ថ្ងៃខែ</span>
                                <Datepicker v-model="child.DateTimeServed" :disabled="readOnly" :maxDate="new Date()"
                                    :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                            </label>
                            <div class="sm:col-span-2">
                                <UButton color="red" variant="soft" size="sm" type="button" :disabled="readOnly"
                                    @click="removeServeHistory(index)">
                                    <TwFeather type="trash-2" :size="16" class="mr-1" />
                                    <span>លុបជួរ</span>
                                </UButton>
                            </div>
                        </div>
                    </div>
                    <UButton color="gray" size="sm" type="button" class="mt-3" :disabled="readOnly"
                        @click="ClientServeHistory.push({ nameCenterorPrison: '', DateTimeServed: '' })">
                        <TwFeather type="plus" :size="16" class="mr-1" />
                        <span>បន្ថែមមជ្ឈមណ្ឌល</span>
                    </UButton>
                </div>
                <div class="col-span-12">
                    <span class="text-sm text-gray-500 dark:text-gray-400">ធ្លាប់ចូលមជ្ឈមណ្ឌល ឬទទួលសេវាប្រហាក់ប្រហែលពីមុន</span>
                    <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                        <URadio v-for="(opt, index) of UsedtoRehabOption" :key="index" v-model="formData.UsedtoRehab"
                            v-bind="opt" :disabled="readOnly" class="font-[Battambang]" />
                    </div>
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="តើអ្នកចូលមករស់នៅក្នុងមជ្ឈមណ្ឌលនេះលើកទីប៉ុន្មាន?" name="HowManyTimeHaveServed"
                        required v-model="formData.HowManyTimeHaveServed" placeholder="ចំនួន" type="text" />
                    <CustomErrorMessage name="HowManyTimeHaveServed" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មូលហេតុនៃការនាំចូលមករស់នៅក្នុងមជ្ឈមណ្ឌល៖" name="ReasonComingtoCenter" required
                        v-model="formData.ReasonComingtoCenter" placeholder="មូលហេតុ" type="text" />
                    <CustomErrorMessage name="ReasonComingtoCenter" />
                </div>
                    <div class="col-span-12">
                        <h4 class="mt-2 text-lg font-[Moul] text-primary">៧. រៀបរាប់ត្រួសៗ អំពីសម្មភាព និងកាលវិភាគប្រចាំថ្ងៃរបស់អតិថិជន</h4>
                        <hr class="my-2 border dark:border-gray-700" />
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
                        <h4 class="mt-2 text-lg font-[Moul] text-primary">៨. ការទំនាក់ទំនងរបស់អតិថិជនក្នុងមជ្ឈមណ្ឌល</h4>
                        <hr class="my-2 border dark:border-gray-700" />
                    </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="មិត្តភក្តិ៖" name="RelationshipWithFriends" required
                        v-model="formData.RelationshipWithFriends" placeholder="" type="text" />
                    <CustomErrorMessage name="RelationshipWithFriends" />
                </div>
                <div class="col-span-12 lg:col-span-6">
                    <TwInput label="បុគ្គលិក" name="RelationshipWithStaff" required
                        v-model="formData.RelationshipWithStaff" placeholder="" type="text" />
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
                        name="ConcernForClientFuture" required class="h-[5rem]"
                        v-model="formData.ConcernForClientFuture" placeholder="" type="text" />
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
                    <TwInput label="ផែនការក្នុងអនាគតដែលបានស្នើឡើង រៀបរាប់លំអិត" name="FuturePlanforClientDetails"
                        required v-model="formData.FuturePlanforClientDetails" placeholder="រៀបរាប់លំអិត" type="text" />
                    <CustomErrorMessage name="FuturePlanforClientDetails" />
                </div>
                    <div class="col-span-12">
                        <h4 class="mt-2 text-lg font-[Moul] text-primary">១២. តើអតិថិជនរបស់អ្នកមានបញ្ហាអ្វីខ្លះ</h4>
                        <hr class="my-2 border dark:border-gray-700" />
                    </div>
                <div class="col-span-12 lg:col-span-6">
                    <span class="text-sm text-gray-500 dark:text-gray-400">អតិថិជនធ្លាក់ទឹកចិត្តខ្លាំង (ឧ.ចង់ធ្វើឃាត ប្រើជាតិពុល ប្រើគ្រឿងញៀន ។ល។)</span>
                    <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                        <URadio v-for="(opt, index) of ClientFeelsHopless" :key="index" v-model="formData.ClientFeelsHopless"
                            v-bind="opt" :disabled="readOnly" class="font-[Battambang]" />
                    </div>
                </div>
                <div v-if="formData.ClientFeelsHopless" class="col-span-12 lg:col-span-6">
                    <TwInput label="ពត៌មានបន្ថែម" name="ClientHoplessDetails" required
                        v-model="formData.ClientHoplessDetails" placeholder="រៀបរាប់លំអិត" type="text" />
                    <CustomErrorMessage name="ClientHoplessDetails" />
                </div>
                <div class="col-span-12">
                    <span class="text-sm text-gray-500 dark:text-gray-400">បញ្ហាដែលអតិថិជនជួបប្រទះ (ជ្រើសរើសបានច្រើន)</span>
                    <ClientOnly>
                        <div class="mt-2 flex flex-wrap gap-x-6 gap-y-2">
                            <UCheckbox v-for="(item, index) of ClientHopelessMultiple" :key="index"
                                v-model="item.check" :name="item.value" :label="item.label" :disabled="readOnly"
                                class="font-[Battambang]" />
                        </div>
                    </ClientOnly>
                </div>
                <div class="col-span-12">
                    <TwTextarea
                        label="១៣. តាមរយៈការសំភាសន៍របស់អ្នកជាមួយអតិថិជន តើអ្នកយល់ឃើញដូចយ៉ាងណាអំពីស្ថានភាពរបស់អតិថិជន?"
                        name="InterviewerOpinoin" required class="h-[5rem]" v-model="formData.InterviewerOpinoin"
                        placeholder="" type="text" />
                    <CustomErrorMessage name="InterviewerOpinoin" />
                </div>
                    </div>
                </section>

                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">III. កំណត់ត្រាអំពីការរីកចម្រើន</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12">
                    <div class="space-y-3">
                        <div v-for="(child, index) in ClientProgress" :key="index"
                            class="grid grid-cols-1 items-end gap-3 rounded-lg border p-3 dark:border-gray-700 sm:grid-cols-12">
                            <div class="sm:col-span-1">
                                <span class="text-sm text-gray-500 dark:text-gray-400">ល.រ</span>
                                <p class="mt-1 h-10 text-base leading-10 text-gray-800 dark:text-gray-100">
                                    {{ index + 1 }}
                                </p>
                            </div>
                            <label class="block sm:col-span-3">
                                <span class="text-sm text-gray-500 dark:text-gray-400">កាលបរិច្ឆេទ</span>
                                <Datepicker v-model="child.NoteDateTime" :disabled="readOnly" :maxDate="new Date()"
                                    :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                            </label>
                            <label class="block sm:col-span-6">
                                <span class="text-sm text-gray-500 dark:text-gray-400">
                                    ការអភិវឌ្ឍន៍សំខាន់ៗ/សេវាដែលបានផ្តល់ឱ្យអតិថិជន
                                </span>
                                <input v-model="child.Details" :disabled="readOnly" type="text"
                                    placeholder="ការអភិវឌ្ឍន៍សំខាន់ៗ/សេវាដែលបានផ្តល់"
                                    class="mt-1 h-10 w-full rounded border px-2 text-base dark:border-gray-700 dark:bg-gray-900" />
                            </label>
                            <div class="sm:col-span-2">
                                <UButton color="red" variant="soft" size="sm" type="button" :disabled="readOnly"
                                    @click="removeProgress(index)">
                                    <TwFeather type="trash-2" :size="16" class="mr-1" />
                                    <span>លុបជួរ</span>
                                </UButton>
                            </div>
                        </div>
                    </div>
                    <UButton color="gray" size="sm" type="button" class="mt-3" :disabled="readOnly"
                        @click="ClientProgress.push({ NoteDateTime: '', Details: '' })">
                        <TwFeather type="plus" :size="16" class="mr-1" />
                        <span>បន្ថែមកំណត់ត្រា</span>
                    </UButton>
                </div>

                    </div>
                </section>

                <!-- The interviewer's own details, a section of their own as on the
                     other forms rather than four fields trailing the last one. -->
                <section class="col-span-12 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <h3 class="text-xl font-[Moul] text-primary">ការសម្ភាសន៍</h3>
                    <hr class="my-2 border dark:border-gray-700" />
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 lg:col-span-6">
                            <span class="text-sm text-gray-500 dark:text-gray-400">ឈ្មោះមន្ត្រីឬបុគ្គលិកសង្គមកិច្ច</span>
                            <p class="mt-1 h-10 text-base leading-10 text-gray-800 dark:text-gray-100">
                                {{
                                    //@ts-ignored
                                    token?.fullname || '—'
                                }}
                            </p>
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <TwInput label="ហត្ថលេខា" name="InterViewerSignature" required
                                v-model="formData.InterViewerSignature" placeholder="ហត្ថលេខា" type="text"
                                :disabled="readOnly" />
                            <CustomErrorMessage name="InterViewerSignature" />
                        </div>
                        <div class="col-span-12 lg:col-span-6">
                            <TwInput label="តួនាទី" name="InterviewerPosition" required
                                v-model="formData.InterviewerPosition" placeholder="តួនាទី" type="text"
                                :disabled="readOnly" />
                            <CustomErrorMessage name="InterviewerPosition" />
                        </div>
                        <label class="col-span-12 block lg:col-span-6">
                            <span class="text-sm text-gray-500 dark:text-gray-400">កាលបរិច្ឆេទសម្ភាសន៍</span>
                            <Datepicker v-model="formData.InterViewDate" :disabled="readOnly" :maxDate="new Date()"
                                :enableTimePicker="false" format="dd/MM/yyyy" autoApply class="mt-1" />
                        </label>
                    </div>
                </section>
                <!-- Same pair as ទម្រង់ទី២: back beside save, no reset. -->
                <div class="col-span-12 flex justify-end gap-2">
                    <NuxtLink :to="prop.id ? `/client/id/${prop.id}` : '/client'">
                        <UButton color="gray" size="xl" type="button">
                            <span class="font-[Moul] text-lg">ត្រឡប់ក្រោយ</span>
                        </UButton>
                    </NuxtLink>
                    <UButton color="primary" type="submit" size="xl" :loading="saving" :disabled="readOnly">
                        <TwFeather type="save" :size="18" class="mr-1" />
                        <span class="font-[Moul] text-lg">រក្សាទុក</span>
                    </UButton>
                </div>
            </TwForm>
        </div>
    </div>
</template>
