<script setup lang="ts">
import {
  useForm,
  TwInput,
  TwForm,
  TwSelect,
  useToast,
  TwOffcanvas,
  TwToast,
  TwFile,
} from 'vue3-tailwind'
import { type ServiceCenter, type Staff, type governStaff } from '@prisma/client'
import title from '~/store/data/title'
import Datepicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"
import { string } from 'zod'
import gazetteers from "~/store/data/gazetteers"

const config = useRuntimeConfig()
const prop = defineProps<{
  openisTrue: boolean,
  readOnly: boolean,
  id: string | undefined | null,
  serviceCenterID?: string | null // Changed to optional
  organisationID?: string | null // Added new optional prop
  typeEmployee: string
}>()

const emit = defineEmits<{
  (event: 'canvasIsOpen', isOpen: boolean): void
}>()
let temTitle: any = []

title.forEach(ele => {
  temTitle.push({
    label: ele.name,
    value: ele.name
  })
})

const openisTrues = ref()
const formRulesEdit = {
  firstName: ['string', 'required'],
  lastName: ['string', 'required'],
  serviceCenterID: ['string', 'required'],
}

const formNameEdit = "centerStaffForm";
const formDataEdit: {
  [key: string]: any;
} = reactive({
  id: prop.id ? prop.id : 'asdf',
  photo: '',
  fullnameEN: '',
  workingPeroidStart: '',
  workingContractAt: '',
  attachedContract: '',
  attachedBackground: '',
  attachedFileInfomation: '',
  firstName: '',
  lastName: '',
  nationality: '',
  dateofbirth: '',
  birthAddress: '',
  birthCity: '',
  birthDistrict: '',
  birthCommune: '',
  birthVillage: '',
  currentAddress: '',
  currentCity: '',
  currentDistrict: '',
  currentCommune: '',
  currentVillage: '',
  currentQualification: '',
  sID: '',
  passport: '',
  workingEXP: '',
  workingEXPYes: '',
  gender: '',
  position: '',
  telephone: '',
  familyAddress: '',
  familyAddressCity: '',
  familyAddressDistrict: '',
  familyAddressCommune: '',
  familyAddressVillage: '',
  familyPhoneNumber: '',
  familyEmail: '',
  serviceCenterID: prop.serviceCenterID ?? null,
  organisationID: prop.organisationID ?? null,
});


const toast = useToast()
const { uploadImage } = useImageUpload()
const { toasts: useToat } = useToast()
const composableForm = useForm();
const isErrorEdit = ref(false);
const formEdit = computed(() => composableForm.getForm(formNameEdit));
const validatorEdit = computed(() => formEdit.value.validator);

const clearEdit = () => {
  formDataEdit.id = null
  formDataEdit.photo = null
  formDataEdit.fullnameEN = null
  formDataEdit.workingPeroidStart = null
  formDataEdit.workingContractAt = null
  formDataEdit.attachedContract = null
  formDataEdit.attachedBackground = null
  formDataEdit.attachedFileInfomation = null
  formDataEdit.firstName = null
  formDataEdit.lastName = null
  formDataEdit.nationality = null
  formDataEdit.dateofbirth = null
  formDataEdit.birthAddress = null
  formDataEdit.birthCity = null
  formDataEdit.birthDistrict = null
  formDataEdit.birthCommune = null
  formDataEdit.birthVillage = null
  formDataEdit.currentAddress = null
  formDataEdit.currentCity = null
  formDataEdit.currentDistrict = null
  formDataEdit.currentCommune = null
  formDataEdit.currentVillage = null
  formDataEdit.currentQualification = null
  formDataEdit.sID = null
  formDataEdit.passport = null
  formDataEdit.workingEXP = null
  formDataEdit.workingEXPYes = null
  formDataEdit.gender = null
  formDataEdit.position = null
  formDataEdit.telephone = null
  formDataEdit.familyAddress = null
  formDataEdit.familyAddressCity = null
  formDataEdit.familyAddressDistrict = null
  formDataEdit.familyAddressCommune = null
  formDataEdit.familyAddressVillage = null
  formDataEdit.familyPhoneNumber = null
  formDataEdit.familyEmail = null
  formDataEdit.serviceCenterID = null
  formDataEdit.organisationID = null
  setTimeout(() => {
    validatorEdit.value.clearErrors();
  }, 100)
}

async function submitEdit() {
  if (prop.readOnly) return;
  if (!(await confirmDialog())) return;
  validatorEdit.value.clearErrors();
  await validatorEdit.value.validate();
  if (validatorEdit.value.fail()) {

    toast.error({
      message: validatorEdit.value.getErrorMessage(),
    });

    isErrorEdit.value = true;
    setTimeout(() => {
      isErrorEdit.value = false;
    }, 1000);
    return true;
  }

  const oldImageURL = formDataEdit.photo
  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous photo, or none,
    // while telling the user it worked.
    toast.error({ message: "មិនអាចផ្ទុករូបភាពបានទេ" })
    return
  }
  if (image) {
    formDataEdit.photo = image[0]
    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
  }

  const { error } = await useFetch('/api/center/staff/upsert', {
    method: "POST",
    body: JSON.stringify({
      id: formDataEdit.id,
      photo: formDataEdit.photo,
      fullnameEN: formDataEdit.fullnameEN,
      workingPeroidStart: formDataEdit.workingPeroidStart,
      workingContractAt: formDataEdit.workingContractAt,
      attachedContract: formDataEdit.attachedContract,
      attachedBackground: formDataEdit.attachedBackground,
      attachedFileInfomation: formDataEdit.attachedFileInfomation,
      firstName: formDataEdit.firstName,
      lastName: formDataEdit.lastName,
      nationality: formDataEdit.nationality,
      dateofbirth: formDataEdit.dateofbirth,
      birthAddress: formDataEdit.birthAddress,
      birthCity: formDataEdit.birthCity,
      birthDistrict: formDataEdit.birthDistrict,
      birthCommune: formDataEdit.birthCommune,
      birthVillage: formDataEdit.birthVillage,
      currentAddress: formDataEdit.currentAddress,
      currentQualification: formDataEdit.currentQualification,
      currentCity: formDataEdit.currentCity,
      currentDistrict: formDataEdit.currentDistrict,
      currentCommune: formDataEdit.currentCommune,
      currentVillage: formDataEdit.currentVillage,
      sID: formDataEdit.sID,
      passport: formDataEdit.passport,
      workingEXP: SelectWorkEXP.value,
      workingEXPYes: formDataEdit.workingEXPYes,
      gender: formDataEdit.gender,
      position: formDataEdit.position,
      telephone: formDataEdit.telephone,
      familyAddress: formDataEdit.familyAddress,
      familyAddressCity: formDataEdit.familyAddressCity,
      familyAddressDistrict: formDataEdit.familyAddressDistrict,
      familyAddressCommune: formDataEdit.familyAddressCommune,
      familyAddressVillage: formDataEdit.familyAddressVillage,
      familyPhoneNumber: formDataEdit.familyPhoneNumber,
      familyEmail: formDataEdit.familyEmail,
      serviceCenterID: formDataEdit.serviceCenterID,
      organisationID: formDataEdit.organisationID,
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
  //@ts-ignore
  openisTrues?.value?.closeOffCanvas();
  emit('canvasIsOpen', true)
}

onMounted(() => {
  if (prop.openisTrue) {
    // console.log(prop.openisTrue)
    openisTrues?.value?.openOffCanvas();
  }
})

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

const SelectWorkEXP = ref(true)
const WorkEXP = [{
  value: false,
  label: 'មិនធ្លាប់',
},
{
  value: true,
  label: 'ធ្លាប់',
},
]



if (prop.id && prop.typeEmployee === 'Contract') {
  const { data } = await useFetch<{ data: Staff, error: '', status: '' }>('/api/center/staff/getSingleStaff', {
    method: 'POST', body: JSON.stringify({
      id: prop.id,
      typeEmployee: prop.typeEmployee
    })
  })

  formDataEdit.id = data.value?.data?.id
  formDataEdit.fullnameEN = data.value?.data?.fullnameEN
  formDataEdit.photo = data?.value?.data.photo
  formDataEdit.workingPeroidStart = data?.value?.data.workingPeroidStart
  formDataEdit.attachedContract = data?.value?.data.attachedContract
  formDataEdit.attachedBackground = data?.value?.data.attachedBackground
  formDataEdit.attachedFileInfomation = data?.value?.data.attachedFileInfomation
  formDataEdit.firstName = data?.value?.data.firstName
  formDataEdit.lastName = data?.value?.data.lastName
  formDataEdit.nationality = data?.value?.data.nationality
  formDataEdit.dateofbirth = data?.value?.data.dateofbirth
  formDataEdit.birthAddress = data?.value?.data.birthAddress
  formDataEdit.birthCity = data?.value?.data.birthCity
  formDataEdit.birthDistrict = data?.value?.data.birthDistrict
  formDataEdit.birthCommune = data?.value?.data?.birthCommune
  formDataEdit.birthVillage = data?.value?.data?.birthVillage
  formDataEdit.currentAddress = data?.value?.data.currentAddress
  formDataEdit.currentQualification = data?.value?.data.currentQualification
  formDataEdit.currentCity = data?.value?.data.currentCity
  formDataEdit.currentDistrict = data?.value?.data.currentDistrict
  formDataEdit.currentCommune = data?.value?.data.currentCommune
  formDataEdit.currentVillage = data?.value?.data.currentVillage
  formDataEdit.sID = data?.value?.data.sID
  formDataEdit.passport = data?.value?.data.passport
  formDataEdit.workingEXP = data?.value?.data.workingEXP
  SelectWorkEXP.value = data?.value?.data.workingEXP ? data?.value?.data.workingEXP : true
  formDataEdit.workingEXPYes = data?.value?.data.workingEXPYes
  formDataEdit.gender = data?.value?.data.gender
  formDataEdit.position = data?.value?.data.position
  formDataEdit.telephone = data?.value?.data.telephone
  formDataEdit.familyAddress = data?.value?.data.familyAddress
  formDataEdit.familyAddressCity = data?.value?.data?.familyAddressCity
  formDataEdit.familyAddressDistrict = data?.value?.data?.familyAddressDistrict
  formDataEdit.familyAddressCommune = data?.value?.data?.familyAddressCommune
  formDataEdit.familyAddressVillage = data?.value?.data?.familyAddressVillage
  formDataEdit.familyPhoneNumber = data?.value?.data.familyPhoneNumber
  formDataEdit.familyEmail = data?.value?.data.familyEmail
  formDataEdit.serviceCenterID = data?.value?.data.serviceCenterID
}

const { data: organisations } = await useFetch('/api/organisation/get.get')
const organisationList = computed(() => {
  if (!organisations.value) return []
  return (organisations.value as any[]).map((org: any) => ({
    label: org.name,
    value: org.id,
  }))
})

const optionsss = [{
  value: 'Official',
  label: 'មន្ត្រីរាជការ'
}, {
  value: 'Contract',
  label: 'មន្ត្រីកិច្ចសន្យា'
}]

console.log(prop.id, prop.typeEmployee)

if (prop.id) {
  if (prop.typeEmployee === optionsss[0].value) {
    optionsss.splice(1, 1)
  } else {
    optionsss.splice(0, 1)
  }
}

const AddressOption = [{
  value: 'thesame',
  label: 'ដូចអាសយដ្ឋានបច្ចុប្បន្ន',
},
{
  value: 'notthesame',
  label: 'មិនដូចអាសយដ្ឋានបច្ចុប្បន្ន',
},
]

const SIDOption = [{
  value: 'SID',
  label: 'លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ',
},
{
  value: 'Passport',
  label: 'លិខិតឆ្លងដែន',
},
]
const FamilyInformation = [{
  value: 'single',
  label: 'នៅលីវ',
},
{
  value: 'married',
  label: 'រៀបការហើយ',
},
{
  value: 'widow',
  label: 'មេម៉ាយ/ពោះម៉ាយ',
},
]


const SelectSIDOption = ref('SID')
const selectedAddressOption = ref(' ')
const selected = ref(prop.typeEmployee)
const childrenDetails = ref(Array({
  fullnameKH: '',
  gender: '',
  dateofBirth: '',
  occupation: '',
}))

const EducationDetails = ref(Array({
  couseLevel: '',
  SchoolName: '',
  SchoolLocation: '',
  CertificateLevel: '',
  majoring: '',
  StartDate: '',
  finishDate: '',
}))
const governStaffLanuage = ref(Array({
  langName: '',
  read: '',
  conversation: '',
  writing: '',
}))
const governStaffWorkingHistoryPublic = ref(Array({
  DateStartWorking: '',
  DateStopWorking: '',
  OgnisationName: '',
  Department: '',
  position: '',
  SkillInPosition: '',
}))

const governStaffWorkingHistoryPrivate = ref(Array({
  DateStartWorking: '',
  DateStopWorking: '',
  OgnisationName: '',
  position: '',
  SkillInPosition: '',
}))
const governStaffPositionHistory = ref(Array({
  ValidDate: '',
  MinistryName: '',
  Department: '',
  OfficialSection: '',
  oldOfficialLevel: '',
  newOffcialLevel: '',
  changeTo: '',
}))
const governStaffCertificateLevelup = ref(Array({
  validatDate: '',
  SchoolName: '',
  PlaceStudy: '',
  ReceivedCertificate: '',
  OldPosition: '',
  NewPosition: '',
}))
const governStaffSituationOutsideOriginalOfficial = ref(Array({
  startDate: '',
  endDate: '',
  OginasationName: '',
  Position: '',
}))
const GovernStaffFreeNoSalary = ref(Array({
  startDate: '',
  endDate: '',
  Oginisationname: '',
  NumberofMonthandYear: '',
}))
const GovernStaffLetterAppreciation = ref(Array({
  letterNumber: '',
  OfficialDate: '',
  RequestedOrginsation: '',
  LetterDetails: '',
  TypeReceived: '',
}))
const governStaffFineHistory = ref(Array({
  letterNumber: '',
  OffialDate: '',
  RequestedOrginsation: '',
  LetterDetails: '',
  TypeRecieved: '',
}))

const formRulesEditOfficial = {
  firstNameKH: ['string', 'required'],
  lastNameKH: ['string', 'required'],
  firstNameEN: ['string', 'required'],
  lastNameEN: ['string', 'required'],
  serviceCenterID: ['string', 'required'],
}
const formNameEditOfficial = "centerStaffFormOfficial";
const formDataEditOfficial: {
  [key: string]: any;
} = reactive({
  id: prop.id ? prop.id : 'asdf',
  photo: '',
  firstNameKH: '',
  lastNameKH: '',
  firstNameEN: '',
  lastNameEN: '',
  gender: '',
  DateofBirth: '',
  ethnicity: '',
  nationality: '',
  birthAddress: '',
  birthCity: '',
  birthDistrict: '',
  birthCommune: '',
  birthVillage: '',
  permanentAddress: '',
  permanentCity: '',
  permanentDistrict: '',
  permanentCommune: '',
  permanentVillage: '',
  currentAddress: '',
  currentCity: '',
  currentDistrict: '',
  currentCommune: '',
  currentVillage: '',
  telephone: '',
  email: '',
  officialID: '',
  CambodianSocialID: '',
  sIDValidStart: '',
  sIDValidEnd: '',
  physical: '',
  familyInfo: '',
  spouseNameKH: '',
  spuseNameEN: '',
  spouseDateOfBirth: '',
  spouseSID: '',
  spouseBirthAddress: '',
  spouseBirthCity: '',
  spouseBirthDistrict: '',
  spouseBirthCommune: '',
  spouseBirthVillage: '',
  spouseCurrentOccupation: '',
  spouseOrganisationName: '',
  spuseCurrentAddress: '',
  spuseCurrentAddressCity: '',
  spuseCurrentAddressDistrict: '',
  spuseCurrentAddressCommune: '',
  spuseCurrentAddressVillage: '',
  fatherFullNameKH: '',
  fatherOccupation: '',
  fatherBirthAddress: '',
  fatherBirthAddressCity: '',
  fatherBirthAddressDistrict: '',
  fatherBirthAddressCommune: '',
  fatherBirthAddressVillage: '',
  motherOcupation: '',
  motherFullNameKH: '',
  motherBirthAddress: '',
  motherBirthAddressCity: '',
  motherBirthAddressDistrict: '',
  motherBirthAddressCommune: '',
  motherBirthAddressVillage: '',
  ECFirstNameKH: '',
  ECLastNameKH: '',
  ECGender: '',
  ECRelationshipAs: '',
  ECOccupation: '',
  ECAddress: '',
  ECAddressCity: '',
  ECAddressDistrict: '',
  ECAddressCommune: '',
  ECAddressVillage: '',
  ECTelehpone: '',
  DateStartOfficialWork: '',
  DateWentFullTime: '',
  CurrentRank: '',
  OfficialLevelKH: '',
  serviceCenterID: prop.serviceCenterID ?? null,
  organisationID: prop.organisationID ?? null,
});


const isErrorEditOfficial = ref(false);
const formEditOfficial = computed(() => composableForm.getForm(formNameEditOfficial));
const validatorEditOfficial = computed(() => formEditOfficial.value.validator);
// console.log(prop.id, prop.typeEmployee)
if (prop.id && prop.typeEmployee === 'Official') {
  const { data } = await useFetch<{ data: governStaff, error: '', status: '' }>('/api/center/staff/getSingleStaff', {
    method: 'POST', body: JSON.stringify({
      id: prop.id,
      typeEmployee: prop.typeEmployee,

    })
  })
  // console.log(data.value?.data)

  // console.log(data.value?.data)
  formDataEditOfficial.id = data.value?.data.id
  formDataEditOfficial.photo = data.value?.data.photo
  formDataEditOfficial.firstNameKH = data.value?.data.firstNameKH
  formDataEditOfficial.lastNameKH = data.value?.data.lastNameKH
  formDataEditOfficial.firstNameEN = data.value?.data.firstNameEN
  formDataEditOfficial.lastNameEN = data.value?.data.lastNameEN
  formDataEditOfficial.gender = data.value?.data.gender
  formDataEditOfficial.DateofBirth = data.value?.data.DateofBirth
  formDataEditOfficial.ethnicity = data.value?.data.ethnicity
  formDataEditOfficial.nationality = data.value?.data.nationality
  formDataEditOfficial.birthAddress = data.value?.data.birthAddress
  formDataEditOfficial.birthCity = data?.value?.data?.birthCity
  formDataEditOfficial.birthDistrict = data?.value?.data?.birthDistrict
  formDataEditOfficial.birthCommune = data?.value?.data?.birthCommune
  formDataEditOfficial.birthVillage = data?.value?.data?.birthVillage
  formDataEditOfficial.currentAddress = data.value?.data.currentAddress
  formDataEditOfficial.currentCity = data.value?.data.currentCity
  formDataEditOfficial.currentDistrict = data.value?.data.currentDistrict
  formDataEditOfficial.currentCommune = data.value?.data.currentCommune
  formDataEditOfficial.currentVillage = data.value?.data.currentVillage
  formDataEditOfficial.permanentAddress = data.value?.data.permanentAddress
  formDataEditOfficial.permanentCity = data?.value?.data?.permanentCity
  formDataEditOfficial.permanentDistrict = data?.value?.data?.permanentDistrict
  formDataEditOfficial.permanentCommune = data?.value?.data?.permanentCommune
  formDataEditOfficial.permanentVillage = data?.value?.data?.permanentVillage
  formDataEditOfficial.telephone = data.value?.data.telephone
  formDataEditOfficial.email = data.value?.data.email
  formDataEditOfficial.officialID = data.value?.data.officialID
  formDataEditOfficial.CambodianSocialID = data.value?.data.CambodianSocialID
  formDataEditOfficial.sIDValidStart = data.value?.data.sIDValidStart
  formDataEditOfficial.sIDValidEnd = data.value?.data.sIDValidEnd
  formDataEditOfficial.physical = data.value?.data.physical
  formDataEditOfficial.familyInfo = data.value?.data.familyInfo
  formDataEditOfficial.spouseNameKH = data.value?.data.spouseNameKH
  formDataEditOfficial.spuseNameEN = data.value?.data.spuseNameEN
  formDataEditOfficial.spouseDateOfBirth = data.value?.data.spouseDateOfBirth
  formDataEditOfficial.spouseSID = data.value?.data.spouseSID
  formDataEditOfficial.spouseBirthAddress = data.value?.data.spouseBirthAddress
  formDataEditOfficial.spouseCurrentOccupation = data.value?.data.spouseCurrentOccupation
  formDataEditOfficial.spouseOrganisationName = data.value?.data.spouseOrganisationName
  formDataEditOfficial.spuseCurrentAddress = data.value?.data.spuseCurrentAddress
  formDataEditOfficial.spuseCurrentAddressCity = data?.value?.data?.spuseCurrentAddressCity
  formDataEditOfficial.spuseCurrentAddressDistrict = data?.value?.data?.spuseCurrentAddressDistrict
  formDataEditOfficial.spuseCurrentAddressCommune = data?.value?.data?.spuseCurrentAddressCommune
  formDataEditOfficial.spuseCurrentAddressVillage = data?.value?.data?.spuseCurrentAddressVillage
  formDataEditOfficial.fatherFullNameKH = data.value?.data.fatherFullNameKH
  formDataEditOfficial.fatherOccupation = data.value?.data.fatherOccupation
  formDataEditOfficial.fatherBirthAddress = data.value?.data.fatherBirthAddress
  formDataEditOfficial.fatherBirthAddressCity = data?.value?.data?.fatherBirthAddressCity
  formDataEditOfficial.fatherBirthAddressDistrict = data?.value?.data?.fatherBirthAddressDistrict
  formDataEditOfficial.fatherBirthAddressCommune = data?.value?.data?.fatherBirthAddressCommune
  formDataEditOfficial.fatherBirthAddressVillage = data?.value?.data?.fatherBirthAddressVillage
  formDataEditOfficial.motherOcupation = data.value?.data.motherOcupation
  formDataEditOfficial.motherBirthAddressCity = data?.value?.data.motherBirthAddressCity
  formDataEditOfficial.motherBirthAddressDistrict = data?.value?.data.motherBirthAddressDistrict
  formDataEditOfficial.motherBirthAddressCommune = data?.value?.data.motherBirthAddressCommune
  formDataEditOfficial.motherBirthAddressVillage = data?.value?.data.motherBirthAddressVillage
  formDataEditOfficial.motherFullNameKH = data.value?.data.motherFullNameKH
  formDataEditOfficial.motherBirthAddress = data.value?.data.motherBirthAddress
  formDataEditOfficial.ECFirstNameKH = data.value?.data.ECFirstNameKH
  formDataEditOfficial.ECLastNameKH = data.value?.data.ECLastNameKH
  formDataEditOfficial.ECGender = data.value?.data.ECGender
  formDataEditOfficial.ECRelationshipAs = data.value?.data.ECRelationshipAs
  formDataEditOfficial.ECOccupation = data.value?.data.ECOccupation
  formDataEditOfficial.ECAddress = data.value?.data.ECAddress
  formDataEditOfficial.ECAddressCity = data?.value?.data?.ECAddressCity
  formDataEditOfficial.ECAddressDistrict = data?.value?.data?.ECAddressDistrict
  formDataEditOfficial.ECAddressCommune = data?.value?.data?.ECAddressCommune
  formDataEditOfficial.ECAddressVillage = data?.value?.data?.ECAddressVillage
  formDataEditOfficial.ECTelehpone = data.value?.data.ECTelehpone
  formDataEditOfficial.DateStartOfficialWork = data.value?.data.DateStartOfficialWork
  formDataEditOfficial.DateWentFullTime = data.value?.data.DateWentFullTime
  formDataEditOfficial.CurrentRank = data.value?.data.CurrentRank
  formDataEditOfficial.OfficialLevelKH = data.value?.data.OfficialLevelKH
  formDataEditOfficial.serviceCenterID = data.value?.data.serviceCenterID
  //@ts-ignored
  childrenDetails.value = data.value?.data?.governStaffChildren
  //@ts-ignored   
  EducationDetails.value = data.value?.data?.governStaffQualifitcation
  //@ts-ignored
  governStaffLanuage.value = data.value?.data?.governStaffLanuage
  //@ts-ignored
  governStaffWorkingHistoryPublic.value = data.value?.data?.governStaffWorkingHistoryPublic
  //@ts-ignored
  governStaffPositionHistory.value = data.value?.data?.governStaffPositionHistory
  //@ts-ignored
  governStaffCertificateLevelup.value = data.value?.data?.governStaffCertificateLevelup
  //@ts-ignored
  governStaffSituationOutsideOriginalOfficial.value = data.value?.data?.governStaffSituationOutsideOriginalOfficial
  //@ts-ignored
  GovernStaffFreeNoSalary.value = data.value?.data?.governStaffFreeNoSalary
  //@ts-ignored
  GovernStaffLetterAppreciation.value = data.value?.data?.governStaffLetterAppreciation
  //@ts-ignored
  governStaffFineHistory.value = data.value?.data?.governStaffFineHistory
  //@ts-ignored
  governStaffWorkingHistoryPrivate.value = data.value?.data?.governStaffWorkingHistoryPrivate

}

const clearEditOfficial = () => {
  formDataEditOfficial.id = null
  formDataEditOfficial.photo = null
  formDataEditOfficial.firstNameKH = null
  formDataEditOfficial.lastNameKH = null
  formDataEditOfficial.firstNameEN = null
  formDataEditOfficial.lastNameEN = null
  formDataEditOfficial.gender = null
  formDataEditOfficial.DateofBirth = null
  formDataEditOfficial.ethnicity = null
  formDataEditOfficial.nationality = null
  formDataEditOfficial.birthAddress = null
  formDataEditOfficial.birthCity = null
  formDataEditOfficial.birthDistrict = null
  formDataEditOfficial.birthCommune = null
  formDataEditOfficial.birthVillage = null
  formDataEditOfficial.currentAddress = null
  formDataEditOfficial.currentCity = null
  formDataEditOfficial.currentDistrict = null
  formDataEditOfficial.currentCommune = null
  formDataEditOfficial.currentVillage = null
  formDataEditOfficial.permanentAddress = null
  formDataEditOfficial.permanentCity = null
  formDataEditOfficial.permanentDistrict = null
  formDataEditOfficial.permanentCommune = null
  formDataEditOfficial.permanentVillage = null
  formDataEditOfficial.telephone = null
  formDataEditOfficial.email = null
  formDataEditOfficial.officialID = null
  formDataEditOfficial.CambodianSocialID = null
  formDataEditOfficial.sIDValidStart = null
  formDataEditOfficial.sIDValidEnd = null
  formDataEditOfficial.physical = null
  formDataEditOfficial.familyInfo = null
  formDataEditOfficial.spouseNameKH = null
  formDataEditOfficial.spuseNameEN = null
  formDataEditOfficial.spouseDateOfBirth = null
  formDataEditOfficial.spouseSID = null
  formDataEditOfficial.spouseBirthAddress = null
  formDataEditOfficial.spouseBirthCity = null
  formDataEditOfficial.spouseBirthDistrict = null
  formDataEditOfficial.spouseBirthCommune = null
  formDataEditOfficial.spouseBirthVillage = null
  formDataEditOfficial.spouseCurrentOccupation = null
  formDataEditOfficial.spouseOrganisationName = null
  formDataEditOfficial.spuseCurrentAddress = null
  formDataEditOfficial.spuseCurrentAddressCity = null
  formDataEditOfficial.spuseCurrentAddressDistrict = null
  formDataEditOfficial.spuseCurrentAddressCommune = null
  formDataEditOfficial.spuseCurrentAddressVillage = null
  formDataEditOfficial.fatherFullNameKH = null
  formDataEditOfficial.fatherOccupation = null
  formDataEditOfficial.fatherBirthAddress = null
  formDataEditOfficial.fatherBirthAddressCity = null
  formDataEditOfficial.fatherBirthAddressDistrict = null
  formDataEditOfficial.fatherBirthAddressCommune = null
  formDataEditOfficial.fatherBirthAddressVillage = null
  formDataEditOfficial.motherOcupation = null
  formDataEditOfficial.motherFullNameKH = null
  formDataEditOfficial.motherBirthAddress = null
  formDataEditOfficial.motherBirthAddressCity = null
  formDataEditOfficial.motherBirthAddressDistrict = null
  formDataEditOfficial.motherBirthAddressCommune = null
  formDataEditOfficial.motherBirthAddressVillage = null
  formDataEditOfficial.ECFirstNameKH = null
  formDataEditOfficial.ECLastNameKH = null
  formDataEditOfficial.ECGender = null
  formDataEditOfficial.ECRelationshipAs = null
  formDataEditOfficial.ECOccupation = null
  formDataEditOfficial.ECAddress = null
  formDataEditOfficial.ECAddressCity = null
  formDataEditOfficial.ECAddressDistrict = null
  formDataEditOfficial.ECAddressCommune = null
  formDataEditOfficial.ECAddressVillage = null
  formDataEditOfficial.ECTelehpone = null
  formDataEditOfficial.DateStartOfficialWork = null
  formDataEditOfficial.DateWentFullTime = null
  formDataEditOfficial.CurrentRank = null
  formDataEditOfficial.OfficialLevelKH = null
  formDataEditOfficial.organisationID = null
  setTimeout(() => {
    validatorEditOfficial.value.clearErrors();
  }, 100)
}

async function submitEditOfficial() {
  if (prop.readOnly) return;
  if (!(await confirmDialog())) return;
  validatorEditOfficial.value.clearErrors();
  await validatorEditOfficial.value.validate();
  if (validatorEditOfficial.value.fail()) {
    toast.error({
      message: validatorEditOfficial.value.getErrorMessage(),
    });
    isErrorEdit.value = true;
    setTimeout(() => {
      isErrorEdit.value = false;
    }, 1000);
    return true;
  }

  const oldImageURL = formDataEditOfficial.photo
  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous photo, or none,
    // while telling the user it worked.
    toast.error({ message: "មិនអាចផ្ទុករូបភាពបានទេ" })
    return
  }
  if (image) {
    formDataEditOfficial.photo = image[0]
    //delete old profile from server storage
    await useFetch('/api/deleteFile', { method: 'POST', body: JSON.stringify({ imgURL: oldImageURL }) })
  }

  const dataInsert = {
    id: formDataEditOfficial.id,
    photo: formDataEditOfficial.photo,
    firstNameKH: formDataEditOfficial.firstNameKH,
    lastNameKH: formDataEditOfficial.lastNameKH,
    firstNameEN: formDataEditOfficial.firstNameEN,
    lastNameEN: formDataEditOfficial.lastNameEN,
    gender: formDataEditOfficial.gender,
    DateofBirth: formDataEditOfficial.DateofBirth,
    ethnicity: formDataEditOfficial.ethnicity,
    nationality: formDataEditOfficial.nationality,
    birthAddress: formDataEditOfficial.birthAddress,
    birthCity: formDataEditOfficial.birthCity,
    birthDistrict: formDataEditOfficial.birthDistrict,
    birthCommune: formDataEditOfficial.birthCommune,
    birthVillage: formDataEditOfficial.birthVillage,
    currentAddress: formDataEditOfficial.currentAddress,
    currentCity: formDataEditOfficial.currentCity,
    currentDistrict: formDataEditOfficial.currentDistrict,
    currentCommune: formDataEditOfficial.currentCommune,
    currentVillage: formDataEditOfficial.currentVillage,
    permanentAddress: formDataEditOfficial.permanentAddress,
    permanentCity: formDataEditOfficial.permanentCity,
    permanentDistrict: formDataEditOfficial.permanentDistrict,
    permanentCommune: formDataEditOfficial.permanentCommune,
    permanentVillage: formDataEditOfficial.permanentVillage,
    telephone: formDataEditOfficial.telephone,
    email: formDataEditOfficial.email,
    officialID: formDataEditOfficial.officialID,
    CambodianSocialID: formDataEditOfficial.CambodianSocialID,
    sIDValidStart: formDataEditOfficial.sIDValidStart,
    sIDValidEnd: formDataEditOfficial.sIDValidEnd,
    physical: formDataEditOfficial.physical,
    familyInfo: formDataEditOfficial.familyInfo,
    spouseNameKH: formDataEditOfficial.spouseNameKH,
    spuseNameEN: formDataEditOfficial.spuseNameEN,
    spouseDateOfBirth: formDataEditOfficial.spouseDateOfBirth,
    spouseSID: formDataEditOfficial.spouseSID,
    spouseBirthAddress: formDataEditOfficial.spouseBirthAddress,
    spouseBirthCity: formDataEditOfficial.spouseBirthCity,
    spouseBirthDistrict: formDataEditOfficial.spouseBirthDistrict,
    spouseBirthCommune: formDataEditOfficial.spouseBirthCommune,
    spouseBirthVillage: formDataEditOfficial.spouseBirthVillage,
    spouseCurrentOccupation: formDataEditOfficial.spouseCurrentOccupation,
    spouseOrganisationName: formDataEditOfficial.spouseOrganisationName,
    spuseCurrentAddress: formDataEditOfficial.spuseCurrentAddress,
    fatherFullNameKH: formDataEditOfficial.fatherFullNameKH,
    fatherOccupation: formDataEditOfficial.fatherOccupation,
    fatherBirthAddress: formDataEditOfficial.fatherBirthAddress,
    fatherBirthAddressCity: formDataEditOfficial.fatherBirthAddressCity,
    fatherBirthAddressDistrict: formDataEditOfficial.fatherBirthAddressDistrict,
    fatherBirthAddressCommune: formDataEditOfficial.fatherBirthAddressCommune,
    fatherBirthAddressVillage: formDataEditOfficial.fatherBirthAddressVillage,
    motherOcupation: formDataEditOfficial.motherOcupation,
    motherFullNameKH: formDataEditOfficial.motherFullNameKH,
    motherBirthAddress: formDataEditOfficial.motherBirthAddress,
    motherBirthAddressCity: formDataEditOfficial.motherBirthAddressCity,
    motherBirthAddressDistrict: formDataEditOfficial.motherBirthAddressDistrict,
    motherBirthAddressCommune: formDataEditOfficial.motherBirthAddressCommune,
    motherBirthAddressVillage: formDataEditOfficial.motherBirthAddressVillage,
    ECFirstNameKH: formDataEditOfficial.ECFirstNameKH,
    ECLastNameKH: formDataEditOfficial.ECLastNameKH,
    ECGender: formDataEditOfficial.ECGender,
    ECRelationshipAs: formDataEditOfficial.ECRelationshipAs,
    ECOccupation: formDataEditOfficial.ECOccupation,
    ECAddress: formDataEditOfficial.ECAddress,
    ECTelehpone: formDataEditOfficial.ECTelehpone,
    ECAddressCity: formDataEditOfficial.ECAddressCity,
    ECAddressDistrict: formDataEditOfficial.ECAddressDistrict,
    ECAddressCommune: formDataEditOfficial.ECAddressCommune,
    ECAddressVillage: formDataEditOfficial.ECAddressVillage,
    DateStartOfficialWork: formDataEditOfficial.DateStartOfficialWork,
    DateWentFullTime: formDataEditOfficial.DateWentFullTime,
    CurrentRank: formDataEditOfficial.CurrentRank,
    OfficialLevelKH: formDataEditOfficial.OfficialLevelKH,
    serviceCenterID: formDataEditOfficial.serviceCenterID,
    organisationID: formDataEditOfficial.organisationID,
    governStaffChildren: prop.id ? childrenDetails.value.map(item => ({ ...item, governStaffID: prop.id })) : childrenDetails.value,
    governStaffQualifitcation: prop.id ? EducationDetails.value.map(item => ({ ...item, governStaffID: prop.id })) : EducationDetails.value,
    governStaffLanuage: prop.id ? governStaffLanuage.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffLanuage.value,
    governStaffWorkingHistoryPublic: prop.id ? governStaffWorkingHistoryPublic.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffWorkingHistoryPublic.value,
    governStaffWorkingHistoryPrivate: prop.id ? governStaffWorkingHistoryPrivate.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffWorkingHistoryPrivate.value,
    governStaffPositionHistory: prop.id ? governStaffPositionHistory.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffPositionHistory.value,
    governStaffCertificateLevelup: prop.id ? governStaffCertificateLevelup.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffCertificateLevelup.value,
    governStaffSituationOutsideOriginalOfficial: prop.id ? governStaffSituationOutsideOriginalOfficial.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffSituationOutsideOriginalOfficial.value,
    governStaffFreeNoSalary: prop.id ? GovernStaffFreeNoSalary.value.map(item => ({ ...item, governStaffID: prop.id })) : GovernStaffFreeNoSalary.value,
    governStaffLetterAppreciation: prop.id ? GovernStaffLetterAppreciation.value.map(item => ({ ...item, governStaffID: prop.id })) : GovernStaffLetterAppreciation.value,
    governStaffFineHistory: prop.id ? governStaffFineHistory.value.map(item => ({ ...item, governStaffID: prop.id })) : governStaffFineHistory.value,
  }
  const { error, data } = !prop.id ? await useFetch('/api/center/staffOfficial/insert', {
    method: "POST",
    body: JSON.stringify(dataInsert),
  }) : await useFetch('/api/center/staffOfficial/update', {
    method: 'POST',
    body: JSON.stringify(dataInsert)
  })

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
  //@ts-ignore
  openisTrues?.value?.closeOffCanvas();
  emit('canvasIsOpen', true)
}

const files = ref();
// Errors deliberately propagate — see composables/useImageUpload.ts. The caller
// aborts the save rather than storing a record whose image silently went
// missing.
const handleImageUpload = async () => {
  if (readOnly) return;
  return await uploadImage(files.value);
}

watch(selectedAddressOption, () => {
  if (AddressOption[0]?.value == selectedAddressOption.value) {
    formDataEditOfficial.permanentAddress = formDataEditOfficial.currentAddress
  } else if (AddressOption.at(1)?.value == selectedAddressOption.value) {
    formDataEditOfficial.permanentAddress = ''
  }
})


let tempCity: any = []

gazetteers.forEach(ele => {
  tempCity.push({
    label: ele.name.km + ' (' + ele.code + ')',
    value: ele.name.km
  })
})

const cityList = ref(tempCity)


const OfficialtemDistricstList: any = ref([])
const OfficialSelectedDistrict: any = ref([])
const SelectedCityValue = computed(() => formDataEditOfficial.birthCity)

watch(SelectedCityValue, () => {
  OfficialtemDistricstList.value = []
  OfficialSelectedDistrict.value = []
  // temCommutesList.value = []
  // tempVillageList.value = []
  // SelectedCommute.value = []
  OfficialSelectedDistrict.value = gazetteers.find((element: any) => {
    return element.name.km === formDataEditOfficial.birthCity
  })
  OfficialSelectedDistrict?.value?.districts?.values?.forEach((eles: any) => {
    OfficialtemDistricstList?.value?.push({
      label: eles.name.km + ' (' + eles.code + ')',
      value: eles.name.km
    })
  })

})

</script>

<template>
  <div>
    <TwOffcanvas position="right" width="800px" ref="openisTrues">
      <template #headerTitle>
        <span class="font-[Moul] text-primary"> បញ្ចូលបុគ្គលិកមណ្ឌល </span></template>
      <div class="p-5">
        <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="method of optionsss" :key="method.value"
          v-model="selected" v-bind="method" />
      </div>
      <div class="p-4 overflow-auto font-[battambang]">
        <div v-if="selected !== 'Contract'">
          <div class="text-center">
            <h2 class=" font-[Moul]">
              ជីវប្រវត្តិមន្ត្រីរាជការ
            </h2>
          </div>
          <div>
            <h2 class=" font-[Moul]">
              ក.ព័ត៌មានផ្ទាល់ខ្លួន
            </h2>
            <TwForm :name="formNameEditOfficial"
              class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
              :class="{
                'tw-shake': isErrorEditOfficial,
              }" :rules="formRulesEditOfficial" @submit="submitEditOfficial()" :custom-field-name="{
                roleName: 'ឈ្មោះតួនាទី',
                roleDescription: 'ពិពណ៌នាតួនាទី',
              }">
              <div class="col-span-3">
              </div>
              <div class="col-span-12   lg:col-span-5">
                <div class="vt-relative vt-col-span-12 lg:col-span-6  vt-flex vt-items-center vt-justify-center">
                  <div class="vt-relative vt-w-96">
                    <img
                      :src="config.public.origin + '/' + (formDataEditOfficial.photo ? formDataEditOfficial.photo : '')"
                      :class="(files?.length > 0 ? ' hidden ' : ' ')" alt="">
                  </div>
                </div>
                <TwFile v-model="files" label="រូបភាព ៤x៦" />
              </div>
              <div class="col-span-4">
              </div>

              <div class="col-span-12" v-if="prop.serviceCenterID">
                <TwSelect label="បុគ្គលិករបស់មណ្ឌល" name="serviceCenterID" v-model="formDataEdit.serviceCenterID"
                  required :items="serviceCenterList" placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="serviceCenterID" />
              </div>
              <div class="col-span-12" v-else-if="prop.organisationID">
                <TwSelect label="អង្គភាព" name="organisationID" v-model="formDataEdit.organisationID" required
                  :items="organisationList" placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="organisationID" />
              </div>

              <div class="col-span-12 lg:col-span-4">
                <TwInput label="គោត្តនាម" name="lastNameKH" v-model="formDataEditOfficial.lastNameKH"
                  placeholder="គោត្តនាមជាភាសារខ្មែរ" type="text" />
                <CustomErrorMessage name="lastNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-4">
                <TwInput label="នាមខ្លួន" name="firstNameKH" v-model="formDataEditOfficial.firstNameKH"
                  placeholder="នាមខ្លួនជាភាសារខ្មែរ" type="text" />
                <CustomErrorMessage name="firstNameKH" />
              </div>
              <div class="col-span-4 ">
                <TwSelect label="ភេទ" name="formDataEditOfficialgender" v-model="formDataEditOfficial.gender" required
                  :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                  placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="formDataEditOfficialgender" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <TwInput label="គោត្តនាម" name="lastNameEN" v-model="formDataEditOfficial.lastNameEN"
                  placeholder="គោត្តនាមជាភាសារអង់គ្លេស" type="text" />
                <CustomErrorMessage name="lastNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <TwInput label="នាមខ្លួន" name="firstNameEN" v-model="formDataEditOfficial.firstNameEN"
                  placeholder="នាមខ្លួនជាភាសារអង់គ្លេស" type="text" />
                <CustomErrorMessage name="firstNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                <Datepicker v-model="formDataEditOfficial.DateofBirth" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>

                <CustomErrorMessage name="DateofBirth" />
              </div>
              <div class="col-span-12 lg:col-span-3">
                <TwInput label="ជនជាតិ" name="ethnicity" v-model="formDataEditOfficial.ethnicity" placeholder="ជនជាតិ"
                  type="text" />
                <CustomErrorMessage name="ethnicity" />
              </div>
              <div class="col-span-12 lg:col-span-3">
                <TwInput label="សញ្ជាតិ" name="nationality" v-model="formDataEditOfficial.nationality"
                  placeholder="សញ្ជាតិ" type="text" />
                <CustomErrorMessage name="nationality" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput label="ទីកន្លែងកំណើត" name="birthAddress" v-model="formDataEditOfficial.birthAddress"
                  placeholder="# ផ្លូវ ភូមិ" type="text" />
                <CustomErrorMessage name="currentAddress" />
              </div>

              <div class="col-span-12 lg:col-span-6">
                <TwSelect :disabled="readOnly" label="រាជធានី/ខេត្ត" name="city"
                  v-model="formDataEditOfficial.birthCity" required :items="cityList" placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="type" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <label for="" class=" font-bold">
                  ខណ្ឌ/ស្រុក
                </label>
                <ClientOnly>
                  <USelect :disabled="readOnly" name="District" required v-model="formDataEditOfficial.birthDistrict"
                    :options="OfficialtemDistricstList" placeholder="សូមជ្រើសរើស" size="lg" />
                </ClientOnly>
                <CustomErrorMessage name="type" />
              </div>


              <div class="col-span-12 lg:col-span-6 ">
                <TwInput label="អាសយដ្ឋានបច្ចុប្បន្ន" name="currentAddress"
                  v-model="formDataEditOfficial.currentAddress"
                  placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត" type="text" />
                <CustomErrorMessage name="currentAddress" />
              </div>
              <div class="col-span-12">
                <label class="font-bold">អាសយដ្ឋានអចិន្ត្រៃយ៍</label>
                <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of AddressOption"
                  :key="methods.value" v-model="selectedAddressOption" v-bind="methods" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="permanentAddress" label="អាសយដ្ឋានអចិន្ត្រៃយ៍"
                  v-model="formDataEditOfficial.permanentAddress"
                  placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត" type="text" />
                <CustomErrorMessage name="permanentAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="email" label="អ៉ីម៉ែល" v-model="formDataEditOfficial.email" placeholder="អ៉ីម៉ែល"
                  type="text" />
                <CustomErrorMessage name="email" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="telephone" label="លេខទូរស័ព្ទ" v-model="formDataEditOfficial.telephone"
                  placeholder="លេខទូរស័ព្ទ" type="text" />
                <CustomErrorMessage name="telephone" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="officialID" label="អត្ថលេខមន្ត្រីរាជការ" v-model="formDataEditOfficial.officialID"
                  placeholder="អត្ថលេខមន្ត្រីរាជការ" type="text" />
                <CustomErrorMessage name="officialID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="CambodianSocialID" label="លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ"
                  v-model="formDataEditOfficial.CambodianSocialID" placeholder="លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ"
                  type="text" />
                <CustomErrorMessage name="CambodianSocialID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <!-- <TwInput             
                name="sIDValidStart"
                label="សុពលភាព"
                v-model="formDataEditOfficial.sIDValidStart"
                placeholder="សុពលភាព"
                type="text"
              /> -->
                <label for="">សុពលភាព</label>
                <Datepicker v-model="formDataEditOfficial.sIDValidStart" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="sIDValidStart" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <!-- <TwInput             
                name="sIDValidEnd"
                label="ដល់ថ្ងៃ"
                v-model="formDataEditOfficial.sIDValidEnd"
                placeholder="ដល់ថ្ងៃ"
                type="text"
              /> -->
                <label for="">ដល់ថ្ងៃ</label>
                <Datepicker v-model="formDataEditOfficial.sIDValidEnd" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="sIDValidEnd" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwSelect label="កាយសម្បទា" name="physical" v-model="formDataEditOfficial.physical" required
                  :items="[{ value: 'Enough', label: 'គ្រប់គ្រាន់' }, { value: 'Disability', label: 'ពិការភាព' }, { value: 'Other', label: 'ប្រភេទពិការ...' }]"
                  placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="physical" />
              </div>
              <hr>
              <div class="col-span-12">
                <label class="font-bold font-[Moul]">ខ - ព័ត៌មានគ្រួសារ</label>
                <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of FamilyInformation"
                  :key="methods.value" v-model="formDataEditOfficial.familyInfo" v-bind="methods" />
              </div>
              <div class="col-span-12">
                <label for="" class="font-[Moul]"> ខ.១-ព័ត៌មានប្រពន្ធឬប្តី</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseNameKH" label="ឈ្មោះប្រពន្ធឬប្តី" v-model="formDataEditOfficial.spouseNameKH"
                  placeholder="ឈ្មោះប្រពន្ធឬប្តី" type="text" />
                <CustomErrorMessage name="spouseNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spuseNameEN" label="ឈ្មោះជាអក្សរពុម្ពឡាតាំង" v-model="formDataEditOfficial.spuseNameEN"
                  placeholder="ឈ្មោះជាអក្សរពុម្ពឡាតាំង" type="text" />
                <CustomErrorMessage name="spuseNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <!-- <TwInput             
                name="spouseDateOfBirth"
                label="ថ្ងៃខែឆ្នាំកំណើត"
                v-model="formDataEditOfficial.spouseDateOfBirth"
                placeholder="ថ្ងៃខែឆ្នាំកំណើត"
                type="text"
              /> -->
                <label for="">ថ្ងៃខែឆ្នាំកំណើត</label>
                <Datepicker v-model="formDataEditOfficial.spouseDateOfBirth" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="spouseDateOfBirth" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseSID" label="លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ"
                  v-model="formDataEditOfficial.spouseSID" placeholder="លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ" type="text" />
                <CustomErrorMessage name="spouseSID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseBirthAddress" label="ទីកន្លែងកំណើត"
                  v-model="formDataEditOfficial.spouseBirthAddress" placeholder="ទីកន្លែងកំណើត" type="text" />
                <CustomErrorMessage name="spouseBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseCurrentOccupation" label="មុខរបរបច្ចុប្បន្ន"
                  v-model="formDataEditOfficial.spouseCurrentOccupation" placeholder="មុខរបរបច្ចុប្បន្ន" type="text" />
                <CustomErrorMessage name="spouseCurrentOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spuseCurrentAddress" label="កាយសម្បទា" v-model="formDataEditOfficial.spuseCurrentAddress"
                  placeholder="ដល់ថ្ងៃ" type="text" />
                <CustomErrorMessage name="spuseCurrentAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseOrganisationName" label="ឈ្មោះអង្គភាព"
                  v-model="formDataEditOfficial.spouseOrganisationName" placeholder="ឈ្មោះអង្គភាព" type="text" />
                <CustomErrorMessage name="spouseOrganisationName" />
              </div>
              <div class="col-span-12 ">
                <label for="" class="font-bold"> ខ.២-ព័ត៌មានកូន </label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-1" v-for="(child, index) in childrenDetails"
                :key="index">
                <div>
                  <TwInput :label="index + 1 + '. គោត្តនាម និងនាមខ្លួន '" v-model="child.fullnameKH" required
                    placeholder="គោត្តនាម និងនាមខ្លួន" type="text" />
                </div>
                <div>
                  <TwSelect label="ភេទ" v-model="child.gender" required
                    :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                    placeholder="សូមជ្រើសរើស" />
                </div>
                <div>
                  <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                  <Datepicker v-model="child.dateofBirth" :dayNames="[
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
                  <TwInput label="មុខរបរ" required v-model="child.occupation" placeholder="មុខរបរ" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="childrenDetails.push({
                  fullnameKH: '',
                  gender: '',
                  dateofBirth: '',
                  occupation: '',
                })"> បន្ថែមព័ត៌មានកូន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="childrenDetails.pop()">
                  លុបព័ត៌មានកូន </UButton>
              </div>

              <div class="col-span-12">
                <label class=" font-[Moul]"> ខ.៣- ព័ត៌មានឪពុក និងម្តាយបង្កើត</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherFullNameKH" label="ឪពុកឈ្មោះ" v-model="formDataEditOfficial.fatherFullNameKH"
                  placeholder="ឪពុកឈ្មោះ" type="text" />
                <CustomErrorMessage name="fatherFullNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherBirthAddress" label="ទីកន្លែងកំណើត"
                  v-model="formDataEditOfficial.fatherBirthAddress" placeholder="ទីកន្លែងកំណើត" type="text" />
                <CustomErrorMessage name="fatherBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherOccupation" label="មុខរបរបច្ចុប្បន្ន"
                  v-model="formDataEditOfficial.fatherOccupation" placeholder="មុខរបរបច្ចុប្បន្ន" type="text" />
                <CustomErrorMessage name="fatherOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherFullNameKH" label="ម្តាយឈ្មោះ" v-model="formDataEditOfficial.motherFullNameKH"
                  placeholder="ម្តាយឈ្មោះ" type="text" />
                <CustomErrorMessage name="motherFullNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherBirthAddress" label="ទីកន្លែងកំណើត"
                  v-model="formDataEditOfficial.motherBirthAddress" placeholder="ទីកន្លែងកំណើត" type="text" />
                <CustomErrorMessage name="motherBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherOcupation" label="មុខរបរបច្ចុប្បន្ន" v-model="formDataEditOfficial.motherOcupation"
                  placeholder="មុខរបរបច្ចុប្បន្ន" type="text" />
                <CustomErrorMessage name="motherOcupation" />
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> គ-ព័ត៌មានទំនាក់ទំនងក្នុងករណីមានអាសន្ន </label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECFirstNameKH" label="នាមខ្លួន" v-model="formDataEditOfficial.ECFirstNameKH"
                  placeholder="នាមខ្លួន" type="text" />
                <CustomErrorMessage name="ECFirstNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECLastNameKH" label="គោត្តនាម" v-model="formDataEditOfficial.ECLastNameKH"
                  placeholder="គោត្តនាម" type="text" />
                <CustomErrorMessage name="ECLastNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECRelationshipAs" label="ទំនាក់ទំនងត្រូវជា"
                  v-model="formDataEditOfficial.ECRelationshipAs" placeholder="ទំនាក់ទំនងត្រូវជា" type="text" />
                <CustomErrorMessage name="ECRelationshipAs" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwSelect label="ភេទ" name="ECGender" v-model="formDataEditOfficial.ECGender" required
                  :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                  placeholder="សូមជ្រើសរើស" />
                <CustomErrorMessage name="ECGender" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECOccupation" label="មុខរបរបច្ចុប្បន្ន" v-model="formDataEditOfficial.ECOccupation"
                  placeholder="មុខរបរបច្ចុប្បន្ន" type="text" />
                <CustomErrorMessage name="ECOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECAddress" label="អាសយដ្ឋានបច្ចុប្បន្ន" v-model="formDataEditOfficial.ECAddress"
                  placeholder="អាសយដ្ឋានបច្ចុប្បន្ន" type="text" />
                <CustomErrorMessage name="ECAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECTelehpone" label="លេខទូរស័ព្ទ" v-model="formDataEditOfficial.ECTelehpone"
                  placeholder="លេខទូរស័ព្ទ" type="text" />
                <CustomErrorMessage name="ECTelehpone" />
              </div>
              <div class="col-span-12">
                <label for="" class=" font-[Moul]"> ឃ-កំរិតវប្បធម៌ទូទៅ​ ការបណ្តុះបណ្តាលមុខវិជ្ជាជីវៈ​
                  និងការបណ្តុះបណ្តាលបន្ត</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-2 " v-for="(item, index) in EducationDetails"
                :key="index">
                <div>
                  <TwInput label="វគ្គឬកម្រិតសិក្សា" required v-model="item.couseLevel" placeholder="វគ្គឬកម្រិតសិក្សា"
                    type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <TwInput label="គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល" required v-model="item.SchoolName"
                    placeholder="គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល" type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <TwInput label="រាជធានីខេត្តឬប្រទេស" required v-model="item.SchoolLocation"
                    placeholder="រាជធានីខេត្តឬប្រទេស" type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <TwInput label="សញ្ញាបត្រ" required v-model="item.CertificateLevel" placeholder="សញ្ញាបត្រ"
                    type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <TwInput label="ជំនាញ" required v-model="item.majoring" placeholder="ជំនាញ" type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំចូលសិក្សា</label>
                  <Datepicker v-model="item.StartDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                  <CustomErrorMessage name="DateStartOfficialWork" />
                </div>
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់សិក្សា</label>
                  <Datepicker v-model="item.finishDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                  <CustomErrorMessage name="DateStartOfficialWork" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="EducationDetails.push({
                  couseLevel: '',
                  SchoolName: '',
                  SchoolLocation: '',
                  CertificateLevel: '',
                  majoring: '',
                  StartDate: '',
                  finishDate: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="EducationDetails.pop()">
                  លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for=""> ង-ភាសារបរទេស(សូមបំពេញនូវកម្រិតចំណេះដឹងភាសាបរទេស​)</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2" v-for="(item, index) in governStaffLanuage"
                :key="index">
                <div>
                  <TwInput label="ភាសាបរទេស" required v-model="item.langName" placeholder="ភាសាបរទេស" type="text" />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div>
                  <TwSelect label="ការអាន" v-model="item.read" required
                    :items="[{ value: 'good', label: 'ល្អ' }, { value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                    placeholder="សូមជ្រើសរើស" />
                </div>
                <div>
                  <TwSelect label="ការសន្ទនា" v-model="item.conversation" required
                    :items="[{ value: 'good', label: 'ល្អ' }, { value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                    placeholder="សូមជ្រើសរើស" />
                </div>
                <div>
                  <TwSelect label="ការសរសេរ" v-model="item.writing" required
                    :items="[{ value: 'good', label: 'ល្អ' }, { value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                    placeholder="សូមជ្រើសរើស" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffLanuage.push({
                  langName: '',
                  read: '',
                  conversation: '',
                  writing: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffLanuage.pop()">
                  លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> ច-ប្រវត្តិការងារ</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើក្របខ័ណ្ឌរដ្ឋ</label>
                <Datepicker v-model="formDataEditOfficial.DateStartOfficialWork" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="DateStartOfficialWork" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <label for="">ថ្ងៃខែឆ្នាំតាំងស៊ុបក្នុងក្របខ័ណ្ឌរដ្ឋ</label>
                <Datepicker v-model="formDataEditOfficial.DateWentFullTime" :dayNames="[
                  'Mo',
                  'Tu',
                  'We',
                  'Th',
                  'Fr',
                  'Sa',
                  'Su',
                ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="DateWentFullTime" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="CurrentRank" label="ឈ្មោះក្របខណ្ឌ" v-model="formDataEditOfficial.CurrentRank"
                  placeholder="ឈ្មោះក្របខណ្ឌ" type="text" />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="OfficialLevelKH" label="ក្របខណ្ឌ ឋានន្តរស័ក្ក​ និងថ្នាក់បច្ចុប្បន្ន"
                  v-model="formDataEditOfficial.OfficialLevelKH" placeholder="ក.៣.២" type="text" />
                <CustomErrorMessage name="OfficialLevelKH" />
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for=""> ច.១-មុខតំណែង(សូមបំពេញ​ ពីថ្មីទៅចាស់) </label>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for=""> ច.១.១-ក្នុងវិស័យសាធារណៈ </label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-2"
                v-for="(item, index) in governStaffWorkingHistoryPublic" :key="index">
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើការងារ</label>
                  <Datepicker v-model="item.DateStartWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                  <CustomErrorMessage name="DateWentFullTime" />
                </div>
                <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                  <Datepicker v-model="item.DateStopWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង-ស្ថាប័ន" v-model="item.OgnisationName" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="នាយកដ្ឋាន-អង្គភាព" v-model="item.Department" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="មុខតំណែង" v-model="item.position" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ជំនាញ/បច្ចេកទេសក្នុងមុខតំណែង" v-model="item.SkillInPosition" placeholder=""
                    type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffWorkingHistoryPublic.push({
                  DateStartWorking: '',
                  DateStopWorking: '',
                  OgnisationName: '',
                  Department: '',
                  position: '',
                  SkillInPosition: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffWorkingHistoryPublic.pop()"> លុបព័ត៌មាន </UButton>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for=""> ច.១.២-ក្នុងវិស័យឯកជន </label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2"
                v-for="(item, index) in governStaffWorkingHistoryPrivate" :key="index">
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើការងារ</label>
                  <Datepicker v-model="item.DateStartWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                  <CustomErrorMessage name="DateWentFullTime" />
                </div>
                <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                  <Datepicker v-model="item.DateStopWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="គ្រឹះស្ថាន-អង្គភាព" v-model="item.OgnisationName" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="តួនាទី" v-model="item.position" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ជំនាញ/បច្ចេកទេស" v-model="item.SkillInPosition" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffWorkingHistoryPrivate.push({
                  DateStartWorking: '',
                  DateStopWorking: '',
                  OgnisationName: '',
                  position: '',
                  SkillInPosition: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffWorkingHistoryPrivate.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> ច.២-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមវេនជ្រើសរើស អតីតភាព
                  ប្តូរប្រភេទក្របខណ្ឌ
                  និងនិយ័តកម្មថ្នាក់ (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់) </label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffPositionHistory" :key="index">
                <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                  <Datepicker v-model="item.ValidDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង-ស្ថាប័ន" v-model="item.MinistryName" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="នាយកដ្ឋាន-អង្គភាព" v-model="item.Department" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ការិយាល័យ-ផ្នែក" v-model="item.OfficialSection" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ចាស់" v-model="item.oldOfficialLevel" placeholder=""
                    type="text" />
                </div>
                <div>
                  <TwInput label="ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ថ្មី" v-model="item.newOffcialLevel" placeholder=""
                    type="text" />
                </div>
                <div>
                  <TwInput label="ប្រភេទដំឡើង/ប្តូរ" v-model="item.changeTo" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffPositionHistory.push({
                  ValidDate: '',
                  MinistryName: '',
                  Department: '',
                  OfficialSection: '',
                  oldOfficialLevel: '',
                  newOffcialLevel: '',
                  changeTo: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffPositionHistory.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> ច.៣-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមសញ្ញាបត្រ(សូមបំពេញតាមលំដាប់
                  ពីថ្មីទៅចាស់)</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffCertificateLevelup" :key="index">
                <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                  <Datepicker v-model="item.validatDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="គ្រឹះស្ថានបណ្តុះបណ្តាល" v-model="item.SchoolName" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ទីកន្លែងសិក្សា" v-model="item.PlaceStudy" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="សញ្ញាបត្រទទួលបាន" v-model="item.ReceivedCertificate" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ចាស់" v-model="item.OldPosition" placeholder=""
                    type="text" />
                </div>
                <div>
                  <TwInput label="ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ថ្មី" v-model="item.NewPosition" placeholder=""
                    type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffCertificateLevelup.push({
                  validatDate: '',
                  SchoolName: '',
                  PlaceStudy: '',
                  ReceivedCertificate: '',
                  OldPosition: '',
                  NewPosition: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffCertificateLevelup.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> ច.៤-ស្ថានភាពស្ថិតនៅក្រៅក្របខ័ណ្ឌដើម (សូមបំពេញតាមលំដាប់
                  ពីថ្មីទៅចាស់)</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffSituationOutsideOriginalOfficial" :key="index">
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំចាប់ផ្តើម</label>
                  <Datepicker v-model="item.startDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់</label>
                  <Datepicker v-model="item.endDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង/ស្ថាប័ន" v-model="item.OginasationName" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="មុខដំណែង" v-model="item.Position" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffSituationOutsideOriginalOfficial.push({
                  startDate: '',
                  endDate: '',
                  OginasationName: '',
                  Position: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffSituationOutsideOriginalOfficial.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">ច.៥-ស្ថានភាពស្ថិតនៅក្នុងភាពទំនេរគ្មានបៀវត្ស (សូមបំពេញតាមលំដាប់
                  ពីថ្មីទៅចាស់)</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2"
                v-for="(item, index) in GovernStaffFreeNoSalary" :key="index">
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំចាប់ផ្តើម</label>
                  <Datepicker v-model="item.startDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់</label>
                  <Datepicker v-model="item.endDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង/ស្ថាប័ន" v-model="item.Oginisationname" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ចំនួន(ខែ/ឆ្នាំ)" v-model="item.NumberofMonthandYear" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="GovernStaffFreeNoSalary.push({
                  startDate: '',
                  endDate: '',
                  Oginisationname: '',
                  NumberofMonthandYear: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="GovernStaffFreeNoSalary.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">ឆ-ការលើសរសើរ ឬដាក់វិន័យ</label>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">ឆ.១-ការលើសរសើរ (គ្រឿងឥស្សរិយយស មេដាយ ប័ណ្ឌសរសើរ)</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1"
                v-for="(item, index) in GovernStaffLetterAppreciation" :key="index">
                <div>
                  <TwInput label="លេខលិខិត" v-model="item.letterNumber" placeholder="" type="text" />
                </div>
                <div>
                  <label for="">កាលបរិច្ចេទ</label>
                  <Datepicker v-model="item.OfficialDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false">
                  </Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)" v-model="item.RequestedOrginsation"
                    placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="បរិយាយ" v-model="item.LetterDetails" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ប្រភេទ" v-model="item.TypeReceived" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="GovernStaffLetterAppreciation.push({
                  letterNumber: '',
                  OfficialDate: '',
                  RequestedOrginsation: '',
                  LetterDetails: '',
                  TypeReceived: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="GovernStaffLetterAppreciation.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]"> ឆ.២-ការដាក់វិន័យ</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1"
                v-for="(item, index) in governStaffFineHistory" :key="index">
                <div>
                  <TwInput label="លេខលិខិត" v-model="item.letterNumber" placeholder="" type="text" />
                </div>
                <div>
                  <label for="">កាលបរិច្ចេទ</label>
                  <Datepicker v-model="item.OffialDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false">
                  </Datepicker>
                </div>
                <div>
                  <TwInput label="ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)" v-model="item.RequestedOrginsation"
                    placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="បរិយាយ" v-model="item.LetterDetails" placeholder="" type="text" />
                </div>
                <div>
                  <TwInput label="ប្រភេទ" v-model="item.TypeRecieved" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffFineHistory.push({
                  letterNumber: '',
                  OffialDate: '',
                  RequestedOrginsation: '',
                  LetterDetails: '',
                  TypeRecieved: '',
                })"> បន្ថែមព័ត៌មាន </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffFineHistory.pop()"> លុបព័ត៌មានកូន </UButton>
              </div>

              <div class="col-span-12 lg:col-span-12  flex justify-end gap-1">
                <UButton :ripple="true" color="gray" square type="button" size="lg"
                  class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEditOfficial()">
                  កំណត់ឡើងវិញ
                </UButton>
                <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
              </div>
            </TwForm>
          </div>
        </div>

        <div v-else>
          <div class="text-center">
            <h2 class="font-[Moul]">
              ជីវប្រវត្តិសង្ខេប
            </h2>
          </div>
          <h2 class="font-[Moul]">
            ក.ព័ត៌មានផ្ទាល់ខ្លួន
          </h2>
          <TwForm :name="formNameEdit"
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
            :class="{
              'tw-shake': isErrorEdit,
            }" :rules="formRulesEdit" @submit="submitEdit()" :custom-field-name="{
              roleName: 'ឈ្មោះតួនាទី',
              roleDescription: 'ពិពណ៌នាតួនាទី',
            }">
            <div class="col-span-3">
            </div>
            <div class="col-span-12   lg:col-span-5">
              <div class="vt-relative vt-col-span-12 lg:col-span-6  vt-flex vt-items-center vt-justify-center">
                <div class="vt-relative vt-w-96">
                  <img :src="config.public.origin + '/' + (formDataEdit.photo ? formDataEdit.photo : '')"
                    :class="(files?.length > 0 ? ' hidden ' : ' ')" alt="">
                </div>
              </div>
              <TwFile v-model="files" label="រូបភាព ៤x៦" />
            </div>
            <div class="col-span-4">
            </div>
            <div class="col-span-12" v-if="prop.serviceCenterID">
              <TwSelect label="បុគ្គលិករបស់មណ្ឌល" name="serviceCenterID" v-model="formDataEdit.serviceCenterID" required
                :items="serviceCenterList" placeholder="សូមជ្រើសរើស" />
              <CustomErrorMessage name="serviceCenterID" />
            </div>
            <div class="col-span-12" v-else-if="prop.organisationID">
              <TwSelect label="អង្គភាព" name="organisationID" v-model="formDataEdit.organisationID" required
                :items="organisationList" placeholder="សូមជ្រើសរើស" />
              <CustomErrorMessage name="organisationID" />
            </div>


            <div class="col-span-12 lg:col-span-3 ">
              <TwInput label="នាមខ្លួន" name="firstName" v-model="formDataEdit.firstName" placeholder="បញ្ចូលឈ្មោះ"
                type="text" />
              <CustomErrorMessage name="firstName" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwInput label="នាមត្រកូល" name="lastName" v-model="formDataEdit.lastName" placeholder="បញ្ចូលនាមត្រកូល"
                type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwSelect label="ភេទ" name="gender" v-model="formDataEdit.gender" required
                :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                placeholder="សូមជ្រើសរើស" />
              <CustomErrorMessage name="gender" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwInput label="សញ្ជាតិ" name="lastName" v-model="formDataEdit.nationality" placeholder="បញ្ចូលនាមត្រកូល"
                type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput label="អក្សរពុម្ភឡាតាំង" name="lastName" v-model="formDataEdit.fullnameEN"
                placeholder="បញ្ចូលនាមត្រកូល" type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <label for="">ខែឆ្នាំកំណើត</label>
              <Datepicker v-model="formDataEdit.dateofbirth" :dayNames="[
                'Mo',
                'Tu',
                'We',
                'Th',
                'Fr',
                'Sa',
                'Su',
              ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput label="កម្រិតវប្បធម៌" name="lastName" v-model="formDataEdit.currentQualification"
                placeholder="បញ្ចូលនាមត្រកូល" type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <label for="">ខែឆ្នាំកំណើត</label>
              <Datepicker v-model="formDataEdit.workingPeroidStart" :dayNames="[
                'Mo',
                'Tu',
                'We',
                'Th',
                'Fr',
                'Sa',
                'Su',
              ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
            </div>
            <div class="col-span-12 ">
              <TwInput label="ទីកន្លែងកំណើត" name="lastName" v-model="formDataEdit.birthAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត" type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12">
              <label class="font-bold">លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ ឬលិខិតឆ្លងដែន</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of SIDOption"
                :key="methods.value" v-model="SelectSIDOption" v-bind="methods" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-if="SelectSIDOption == SIDOption[0].value">
              <TwInput label="លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ" name="lastName" v-model="formDataEdit.sID"
                placeholder="លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ" type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-else>
              <TwInput label="លិខិតឆ្លងដែន" name="lastName" v-model="formDataEdit.passport" placeholder="លិខិតឆ្លងដែន"
                type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 ">
              <TwInput label="ចូលបម្រើការងារជាបុគ្គលិកកិច្ចសន្យានៅ" name="lastName"
                v-model="formDataEdit.workingContractAt" placeholder="ចូលបម្រើការងារជាបុគ្គលិកកិច្ចសន្យានៅ"
                type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12">
              <label class="font-[Moul]">បទពិសោធន៍ការងារ៖</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="(methods, index) of WorkEXP"
                :key="index" v-model="SelectWorkEXP" v-bind="methods" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-if="SelectWorkEXP == true">
              <TwInput label="បំពេញការងារជាមន្រ្តីជាប់កិច្ចសន្យានៅ" name="lastName" v-model="formDataEdit.workingEXPYes"
                placeholder="បំពេញការងារជាមន្រ្តីជាប់កិច្ចសន្យានៅ" type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12">
              <h2 class="font-[Moul]">
                ខ.ព័ត៌មានគ្រួសារ
              </h2>
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput label="អាសយដ្ឋានបច្ចុប្បន្ន" name="lastName" v-model="formDataEdit.familyAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត" type="text" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput label="លេខទូរស័ព្ទ" name="lastName" v-model="formDataEdit.familyPhoneNumber"
                placeholder="លេខទូរស័ព្ទ" type="text" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput label="អ៊ីម៉ែល" name="lastName" v-model="formDataEdit.familyEmail" placeholder="អ៊ីម៉ែល"
                type="text" />
            </div>

            <div class="col-span-12  flex justify-end gap-1">
              <UButton :ripple="true" color="gray" square type="button" size="lg"
                class=" dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEdit()">
                កំណត់ឡើងវិញ
              </UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
            </div>
          </TwForm>
        </div>
      </div>
    </TwOffcanvas>
    <TwToast :toasts="useToat" :class="'font-[battambang]'" :position="'bottom-left'" />
  </div>
</template>