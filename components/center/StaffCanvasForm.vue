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
const { uploadFiles } = useFileUpload()
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

/**
 * Repeatable-row checks — same contract as ទម្រង់ទី១'s. A row where nothing
 * at all was typed is skipped (the server drops it); a half-filled row adds a
 * named problem so the toast says which row and field, and the data-field
 * wrapper on the row's inputs gets the red ring and the scroll.
 */
const ROW_SPECS: Record<string, { key: string; label: string }[]> = {
    childrenDetails: [
        { key: "fullnameKH", label: "ឈ្មោះពេញ" },
        { key: "gender", label: "ភេទ" },
        { key: "dateofBirth", label: "ថ្ងៃខែឆ្នាំកំណើត" },
        { key: "occupation", label: "មុខរបរ" },
    ],
    EducationDetails: [
        { key: "couseLevel", label: "កម្រិតវគ្គសិក្សា" },
        { key: "SchoolName", label: "ឈ្មោះសាលា" },
        { key: "SchoolLocation", label: "ទីតាំងសាលា" },
        { key: "CertificateLevel", label: "កម្រិតសញ្ញាបត្រ" },
        { key: "majoring", label: "ជំនាញ" },
        { key: "StartDate", label: "ថ្ងៃចាប់ផ្តើម" },
        { key: "finishDate", label: "ថ្ងៃបញ្ចប់" },
    ],
    governStaffLanuage: [
        { key: "langName", label: "ភាសា" },
        { key: "read", label: "អាន" },
        { key: "conversation", label: "និយាយ" },
        { key: "writing", label: "សរសេរ" },
    ],
    governStaffWorkingHistoryPublic: [
        { key: "DateStartWorking", label: "ថ្ងៃចាប់ផ្តើម" },
        { key: "DateStopWorking", label: "ថ្ងៃបញ្ចប់" },
        { key: "OgnisationName", label: "អង្គការ" },
        { key: "Department", label: "ដេប៉ាតេម៉ង់" },
        { key: "position", label: "មុខតំណែង" },
        { key: "SkillInPosition", label: "សមត្ថភាពក្នុងមុខតំណែង" },
    ],
    governStaffWorkingHistoryPrivate: [
        { key: "DateStartWorking", label: "ថ្ងៃចាប់ផ្តើម" },
        { key: "DateStopWorking", label: "ថ្ងៃបញ្ចប់" },
        { key: "OgnisationName", label: "អង្គការ" },
        { key: "position", label: "មុខតំណែង" },
        { key: "SkillInPosition", label: "សមត្ថភាពក្នុងមុខតំណែង" },
    ],
    governStaffPositionHistory: [
        { key: "ValidDate", label: "កាលបរិច្ឆេទ" },
        { key: "MinistryName", label: "ក្រសួង" },
        { key: "Department", label: "ដេប៉ាតេម៉ង់" },
        { key: "OfficialSection", label: "គ្រឹះស្ថាន" },
        { key: "oldOfficialLevel", label: "ថ្នាក់ចាស់" },
        { key: "newOffcialLevel", label: "ថ្នាក់ថ្មី" },
        { key: "changeTo", label: "ផ្លាស់ប្តូរទៅ" },
    ],
    governStaffCertificateLevelup: [
        { key: "validatDate", label: "កាលបរិច្ឆេទ" },
        { key: "SchoolName", label: "ឈ្មោះសាលា" },
        { key: "PlaceStudy", label: "កន្លែងសិក្សា" },
        { key: "ReceivedCertificate", label: "សញ្ញាបត្រដែលទទួលបាន" },
        { key: "OldPosition", label: "មុខតំណែងចាស់" },
        { key: "NewPosition", label: "មុខតំណែងថ្មី" },
    ],
    governStaffSituationOutsideOriginalOfficial: [
        { key: "startDate", label: "ថ្ងៃចាប់ផ្តើម" },
        { key: "endDate", label: "ថ្ងៃបញ្ចប់" },
        { key: "OginasationName", label: "អង្គការ" },
        { key: "Position", label: "មុខតំណែង" },
    ],
    GovernStaffFreeNoSalary: [
        { key: "startDate", label: "ថ្ងៃចាប់ផ្តើម" },
        { key: "endDate", label: "ថ្ងៃបញ្ចប់" },
        { key: "Oginisationname", label: "អង្គការ" },
        { key: "NumberofMonthandYear", label: "ចំនួនខែ/ឆ្នាំ" },
    ],
    GovernStaffLetterAppreciation: [
        { key: "letterNumber", label: "លេខលិខិត" },
        { key: "OfficialDate", label: "ថ្ងៃខែ" },
        { key: "RequestedOrginsation", label: "អង្គការស្នើសុំ" },
        { key: "LetterDetails", label: "សេចក្ដីលម្អិត" },
        { key: "TypeReceived", label: "ប្រភេទដែលទទួលបាន" },
    ],
    governStaffFineHistory: [
        { key: "letterNumber", label: "លេខលិខិត" },
        { key: "OffialDate", label: "ថ្ងៃខែ" },
        { key: "RequestedOrginsation", label: "អង្គការស្នើសុំ" },
        { key: "LetterDetails", label: "សេចក្ដីលម្អិត" },
        { key: "TypeRecieved", label: "ប្រភេទដែលទទួលបាន" },
    ],
};

/** The refs holding each list, keyed by name for checkRows below. */
/**
 * The refs holding each list, resolved LAZILY. The list refs are declared
 * further down the file; evaluating them eagerly here (setup runs top to
 * bottom) would touch them before initialisation — the exact TDZ crash that
 * 500s /center/staff.
 */
const rowListRefs: Record<string, () => any[]> = {
    childrenDetails: () => childrenDetails.value,
    EducationDetails: () => EducationDetails.value,
    governStaffLanuage: () => governStaffLanuage.value,
    governStaffWorkingHistoryPublic: () => governStaffWorkingHistoryPublic.value,
    governStaffWorkingHistoryPrivate: () => governStaffWorkingHistoryPrivate.value,
    governStaffPositionHistory: () => governStaffPositionHistory.value,
    governStaffCertificateLevelup: () => governStaffCertificateLevelup.value,
    governStaffSituationOutsideOriginalOfficial: () => governStaffSituationOutsideOriginalOfficial.value,
    GovernStaffFreeNoSalary: () => GovernStaffFreeNoSalary.value,
    GovernStaffLetterAppreciation: () => GovernStaffLetterAppreciation.value,
    governStaffFineHistory: () => governStaffFineHistory.value,
};

const SECTION_LABELS: Record<string, string> = {
    childrenDetails: "កូន",
    EducationDetails: "កម្រិតវគ្គសិក្សា",
    governStaffLanuage: "ភាសា",
    governStaffWorkingHistoryPublic: "ប្រវត្តិការងារ (រដ្ឋ)",
    governStaffWorkingHistoryPrivate: "ប្រវត្តិការងារ (ឯកជន)",
    governStaffPositionHistory: "ប្រវត្តិមុខតំណែង",
    governStaffCertificateLevelup: "ការឡើងកម្រិតសញ្ញាបត្រ",
    governStaffSituationOutsideOriginalOfficial: "ស្ថានភាពក្រៅមុខតំណែង",
    GovernStaffFreeNoSalary: "ចាកចេញដោយគ្មានប្រាក់ខែ",
    GovernStaffLetterAppreciation: "លិខិតកោតសរសើរ",
    governStaffFineHistory: "ប្រវត្តិពិន័យ",
};

function checkRows(problems: { field: string; label: string }[]) {
    for (const [listName, spec] of Object.entries(ROW_SPECS)) {
        const list = (rowListRefs as any)[listName]?.() ?? [];
        list.forEach((row: any, i: number) => {
            const filled = Object.entries(row ?? {}).filter(
                ([, v]) => v !== null && v !== undefined && String(v).trim() !== ""
            );
            if (!filled.length) return;
            for (const f of spec) {
                const v = row?.[f.key];
                if (v === null || v === undefined || String(v).trim() === "") {
                    problems.push({
                        field: `row-${listName}-${f.key}-${i}`,
                        label: `${SECTION_LABELS[listName] ?? listName} ${tr("ជួរដេក")} ${i + 1} — ${tr(f.label)}`,
                    });
                }
            }
        });
    }
}

async function submitEdit() {
  if (prop.readOnly) return;
  if (!(await confirmDialog())) return;
  validatorEdit.value.clearErrors();
  await validatorEdit.value.validate();
  if (validatorEdit.value.fail()) {
    // Named, ringed and scrolled to — the same treatment ទម្រង់ទី១ gives a
    // failed save. getErrorMessage() alone says "2 errors occurred", which
    // names nothing on a form this long.
    const failed: string[] = validatorEdit.value.getFailedFields?.() ?? [];
    toast.error({
      message: failed.length
        ? t('message.fillIn', { fields: failed.map((f) => STAFF_FIELD_LABELS[f] ?? f).join(' / ') })
        : validatorEdit.value.getErrorMessage(),
    });
    isErrorEdit.value = true;
    setTimeout(() => {
      isErrorEdit.value = false;
    }, 1000);
    await nextTick();
    scrollToFirstError();
    return true;
  }

  const oldImageURL = formDataEdit.photo
  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous photo, or none,
    // while telling the user it worked.
    toast.error({ message: tr("មិនអាចផ្ទុករូបភាពបានទេ") + "៖ " + (e as any)?.message })
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
    // The server names what it rejected — repeatable rows especially. Say so,
    // and ring the named wrappers rather than leaving a bare "failed".
    const fields: string[] = Array.isArray(error.value?.data?.fields)
      ? error.value.data.fields
      : [];
    const detail = apiErrorMessage(error.value, tr("មិនជោគជ័យ"));
    toast.error({ message: detail === tr("មិនជោគជ័យ") ? tr("មិនជោគជ័យ") : `${tr("មិនជោគជ័យ")} — ${detail}` });
    if (fields.length) {
      const names = fields.map((f) => {
        const m = /^(\w+)\[(\d+)]\.(\w+)$/.exec(f);
        return m ? `row-${m[1]}-${m[3]}-${m[2]}` : f;
      });
      await nextTick();
      markFieldErrors(names);
      scrollToFirstError();
    }
  } else {
    toast.success({
      message: tr("ជោគជ័យ"),
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

const { t } = useI18n()

/**
 * Field name → the label the user actually sees, so a failed save can name the
 * fields rather than their column names. ទម្រង់ទី១ does the same.
 */
const STAFF_FIELD_LABELS: Record<string, string> = {
  firstNameKH: tr('នាមត្រកូល (ខ្មែរ)'),
  lastNameKH: tr('នាមខ្លួន (ខ្មែរ)'),
  firstNameEN: tr('នាមត្រកូល (ឡាតាំង)'),
  lastNameEN: tr('នាមខ្លួន (ឡាតាំង)'),
  firstName: tr('នាមត្រកូល'),
  lastName: tr('នាមខ្លួន'),
  serviceCenterID: tr('បុគ្គលិករបស់មណ្ឌល'),
}

/**
 * The មណ្ឌល a staff member belongs to.
 *
 * Asked the same two ways ទម្រង់ទី១ asks it. An officer attached to a centre is
 * not choosing one — theirs comes from their own account via /api/center/mine,
 * which any signed-in user may call. A ministry-level user is genuinely
 * choosing and gets the full list, which needs the centre-list right.
 *
 * The select used to render only `v-if="prop.serviceCenterID"`, and the staff
 * page passes null — so on /center/staff the field never appeared at all. A
 * national user had no way to say which centre the person worked at, and the
 * record saved with no centre.
 */
const { data: ownCentre } = await useFetch<{ data: ServiceCenter | null }>('/api/center/mine')

const { data } = await useFetch<{ data: ServiceCenter[] }>('/api/center/get', {
  method: 'POST',
  // Skipped for a centre user: they already have their answer, and this call
  // would 403 for a role that may manage staff but not browse every centre.
  immediate: !ownCentre.value?.data,
})

/** Computed, not built once: the fetches settle after setup runs. */
const serviceCenterList = computed(() => {
  const own = ownCentre.value?.data
  if (own) return [{ label: own.nameKH, value: own.id }]
  return (data.value?.data ?? []).map((ele) => ({ label: ele.nameKH, value: ele.id }))
})

/**
 * A user who belongs to one centre does not pick it. Locked rather than hidden,
 * so the form shows the same field to everyone and the value is visible.
 * The server forces it regardless of what the body says.
 */
const boundToOneCentre = computed(() => !!ownCentre.value?.data)

const SelectWorkEXP = ref(true)
const WorkEXP = computed(() => [{
  value: false,
  label: tr('មិនធ្លាប់'),
},
{
  value: true,
  label: tr('ធ្លាប់'),
},
])



if (prop.id && prop.typeEmployee === 'Contract') {
  // $fetch, not useFetch.
  //
  // useFetch needs the Nuxt instance, and by here setup has already awaited
  // twice (the centre lookups above). After an await that instance is no longer
  // resolvable, so the call returned undefined — reading `.value` off it threw,
  // which killed setup before the off-canvas could render. That is why the
  // កែសម្រួល buttons appeared to do nothing at all: the click opened a component
  // that had already failed.
  //
  // $fetch needs no instance and is what the rest of the app uses for this;
  // components/client/PersonalForm.vue records the same lesson.
  const rec: any = await $fetch('/api/center/staff/getSingleStaff', {
    method: 'POST',
    body: { id: prop.id, typeEmployee: prop.typeEmployee },
  }).then((r: any) => r?.data).catch(() => null)

  formDataEdit.id = rec?.id
  formDataEdit.fullnameEN = rec?.fullnameEN
  formDataEdit.photo = rec?.photo
  formDataEdit.workingPeroidStart = rec?.workingPeroidStart
  formDataEdit.attachedContract = rec?.attachedContract
  formDataEdit.attachedBackground = rec?.attachedBackground
  formDataEdit.attachedFileInfomation = rec?.attachedFileInfomation
  formDataEdit.firstName = rec?.firstName
  formDataEdit.lastName = rec?.lastName
  formDataEdit.nationality = rec?.nationality
  formDataEdit.dateofbirth = rec?.dateofbirth
  formDataEdit.birthAddress = rec?.birthAddress
  formDataEdit.birthCity = rec?.birthCity
  formDataEdit.birthDistrict = rec?.birthDistrict
  formDataEdit.birthCommune = rec?.birthCommune
  formDataEdit.birthVillage = rec?.birthVillage
  formDataEdit.currentAddress = rec?.currentAddress
  formDataEdit.currentQualification = rec?.currentQualification
  formDataEdit.currentCity = rec?.currentCity
  formDataEdit.currentDistrict = rec?.currentDistrict
  formDataEdit.currentCommune = rec?.currentCommune
  formDataEdit.currentVillage = rec?.currentVillage
  formDataEdit.sID = rec?.sID
  formDataEdit.passport = rec?.passport
  formDataEdit.workingEXP = rec?.workingEXP
  SelectWorkEXP.value = rec?.workingEXP ? rec?.workingEXP : true
  formDataEdit.workingEXPYes = rec?.workingEXPYes
  formDataEdit.gender = rec?.gender
  formDataEdit.position = rec?.position
  formDataEdit.telephone = rec?.telephone
  formDataEdit.familyAddress = rec?.familyAddress
  formDataEdit.familyAddressCity = rec?.familyAddressCity
  formDataEdit.familyAddressDistrict = rec?.familyAddressDistrict
  formDataEdit.familyAddressCommune = rec?.familyAddressCommune
  formDataEdit.familyAddressVillage = rec?.familyAddressVillage
  formDataEdit.familyPhoneNumber = rec?.familyPhoneNumber
  formDataEdit.familyEmail = rec?.familyEmail
  formDataEdit.serviceCenterID = rec?.serviceCenterID
}

const { data: organisations } = await useFetch('/api/organisation/get')
const organisationList = computed(() => {
  if (!organisations.value) return []
  return (organisations.value as any[]).map((org: any) => ({
    label: org.name,
    value: org.id,
  }))
})

/**
 * The មន្ត្រីរាជការ / មន្ត្រីកិច្ចសន្យា switch at the top of the canvas.
 *
 * Editing an existing person offers only their own kind: the two live in
 * different tables, so switching the radio mid-edit would point the form at a
 * record that does not exist.
 *
 * That used to be done by mutating the list after the fact —
 * `optionsss[0].value`, then `.splice()`. optionsss is a computed, so indexing
 * it without `.value` gave undefined and reading `.value` off that threw. The
 * block ran only when prop.id was set, which is why registering worked and
 * កែសម្រួល did not: the click opened a component whose setup had already died,
 * so nothing appeared and nothing was logged as a failure.
 *
 * Filtering inside the computed says the same thing without mutating a
 * read-only value, and keeps the labels following the language picker.
 */
const optionsss = computed(() => {
  const all = [
    { value: 'Official', label: tr('មន្ត្រីរាជការ') },
    { value: 'Contract', label: tr('មន្ត្រីកិច្ចសន្យា') },
  ]
  return prop.id ? all.filter((o) => o.value === prop.typeEmployee) : all
})

const AddressOption = computed(() => [{
  value: 'thesame',
  label: tr('ដូចអាសយដ្ឋានបច្ចុប្បន្ន'),
},
{
  value: 'notthesame',
  label: tr('មិនដូចអាសយដ្ឋានបច្ចុប្បន្ន'),
},
])

const SIDOption = computed(() => [{
  value: 'SID',
  label: tr('លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ'),
},
{
  value: 'Passport',
  label: tr('លិខិតឆ្លងដែន'),
},
])
const FamilyInformation = computed(() => [{
  value: 'single',
  label: tr('នៅលីវ'),
},
{
  value: 'married',
  label: tr('រៀបការហើយ'),
},
{
  value: 'widow',
  label: tr('មេម៉ាយ/ពោះម៉ាយ'),
},
])


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

/**
 * Fill the centre in for a user who only has one, on whichever of the two forms
 * is open.
 *
 * Placed after both reactive models are declared: watchEffect runs its callback
 * immediately, and from higher up the file formDataEditOfficial was still in the
 * temporal dead zone — which threw during setup and left the canvas unable to
 * open at all, so the edit buttons did nothing.
 *
 * It only ever fills a blank, so editing an existing staff member never has
 * their centre overwritten.
 */
watchEffect(() => {
  if (!boundToOneCentre.value) return
  const own = serviceCenterList.value[0]?.value
  if (!own) return
  if (!formDataEdit.serviceCenterID) formDataEdit.serviceCenterID = own
  if (!formDataEditOfficial.serviceCenterID) formDataEditOfficial.serviceCenterID = own
})

// console.log(prop.id, prop.typeEmployee)
if (prop.id && prop.typeEmployee === 'Official') {
  // $fetch for the same reason as the contract block above.
  const rec: any = await $fetch('/api/center/staff/getSingleStaff', {
    method: 'POST',
    body: { id: prop.id, typeEmployee: prop.typeEmployee },
  }).then((r: any) => r?.data).catch(() => null)
  // console.log(rec)

  // console.log(rec)
  formDataEditOfficial.id = rec?.id
  formDataEditOfficial.photo = rec?.photo
  formDataEditOfficial.firstNameKH = rec?.firstNameKH
  formDataEditOfficial.lastNameKH = rec?.lastNameKH
  formDataEditOfficial.firstNameEN = rec?.firstNameEN
  formDataEditOfficial.lastNameEN = rec?.lastNameEN
  formDataEditOfficial.gender = rec?.gender
  formDataEditOfficial.DateofBirth = rec?.DateofBirth
  formDataEditOfficial.ethnicity = rec?.ethnicity
  formDataEditOfficial.nationality = rec?.nationality
  formDataEditOfficial.birthAddress = rec?.birthAddress
  formDataEditOfficial.birthCity = rec?.birthCity
  formDataEditOfficial.birthDistrict = rec?.birthDistrict
  formDataEditOfficial.birthCommune = rec?.birthCommune
  formDataEditOfficial.birthVillage = rec?.birthVillage
  formDataEditOfficial.currentAddress = rec?.currentAddress
  formDataEditOfficial.currentCity = rec?.currentCity
  formDataEditOfficial.currentDistrict = rec?.currentDistrict
  formDataEditOfficial.currentCommune = rec?.currentCommune
  formDataEditOfficial.currentVillage = rec?.currentVillage
  formDataEditOfficial.permanentAddress = rec?.permanentAddress
  formDataEditOfficial.permanentCity = rec?.permanentCity
  formDataEditOfficial.permanentDistrict = rec?.permanentDistrict
  formDataEditOfficial.permanentCommune = rec?.permanentCommune
  formDataEditOfficial.permanentVillage = rec?.permanentVillage
  formDataEditOfficial.telephone = rec?.telephone
  formDataEditOfficial.email = rec?.email
  formDataEditOfficial.officialID = rec?.officialID
  formDataEditOfficial.CambodianSocialID = rec?.CambodianSocialID
  formDataEditOfficial.sIDValidStart = rec?.sIDValidStart
  formDataEditOfficial.sIDValidEnd = rec?.sIDValidEnd
  formDataEditOfficial.physical = rec?.physical
  formDataEditOfficial.familyInfo = rec?.familyInfo
  formDataEditOfficial.spouseNameKH = rec?.spouseNameKH
  formDataEditOfficial.spuseNameEN = rec?.spuseNameEN
  formDataEditOfficial.spouseDateOfBirth = rec?.spouseDateOfBirth
  formDataEditOfficial.spouseSID = rec?.spouseSID
  formDataEditOfficial.spouseBirthAddress = rec?.spouseBirthAddress
  formDataEditOfficial.spouseCurrentOccupation = rec?.spouseCurrentOccupation
  formDataEditOfficial.spouseOrganisationName = rec?.spouseOrganisationName
  formDataEditOfficial.spuseCurrentAddress = rec?.spuseCurrentAddress
  formDataEditOfficial.spuseCurrentAddressCity = rec?.spuseCurrentAddressCity
  formDataEditOfficial.spuseCurrentAddressDistrict = rec?.spuseCurrentAddressDistrict
  formDataEditOfficial.spuseCurrentAddressCommune = rec?.spuseCurrentAddressCommune
  formDataEditOfficial.spuseCurrentAddressVillage = rec?.spuseCurrentAddressVillage
  formDataEditOfficial.fatherFullNameKH = rec?.fatherFullNameKH
  formDataEditOfficial.fatherOccupation = rec?.fatherOccupation
  formDataEditOfficial.fatherBirthAddress = rec?.fatherBirthAddress
  formDataEditOfficial.fatherBirthAddressCity = rec?.fatherBirthAddressCity
  formDataEditOfficial.fatherBirthAddressDistrict = rec?.fatherBirthAddressDistrict
  formDataEditOfficial.fatherBirthAddressCommune = rec?.fatherBirthAddressCommune
  formDataEditOfficial.fatherBirthAddressVillage = rec?.fatherBirthAddressVillage
  formDataEditOfficial.motherOcupation = rec?.motherOcupation
  formDataEditOfficial.motherBirthAddressCity = rec?.motherBirthAddressCity
  formDataEditOfficial.motherBirthAddressDistrict = rec?.motherBirthAddressDistrict
  formDataEditOfficial.motherBirthAddressCommune = rec?.motherBirthAddressCommune
  formDataEditOfficial.motherBirthAddressVillage = rec?.motherBirthAddressVillage
  formDataEditOfficial.motherFullNameKH = rec?.motherFullNameKH
  formDataEditOfficial.motherBirthAddress = rec?.motherBirthAddress
  formDataEditOfficial.ECFirstNameKH = rec?.ECFirstNameKH
  formDataEditOfficial.ECLastNameKH = rec?.ECLastNameKH
  formDataEditOfficial.ECGender = rec?.ECGender
  formDataEditOfficial.ECRelationshipAs = rec?.ECRelationshipAs
  formDataEditOfficial.ECOccupation = rec?.ECOccupation
  formDataEditOfficial.ECAddress = rec?.ECAddress
  formDataEditOfficial.ECAddressCity = rec?.ECAddressCity
  formDataEditOfficial.ECAddressDistrict = rec?.ECAddressDistrict
  formDataEditOfficial.ECAddressCommune = rec?.ECAddressCommune
  formDataEditOfficial.ECAddressVillage = rec?.ECAddressVillage
  formDataEditOfficial.ECTelehpone = rec?.ECTelehpone
  formDataEditOfficial.DateStartOfficialWork = rec?.DateStartOfficialWork
  formDataEditOfficial.DateWentFullTime = rec?.DateWentFullTime
  formDataEditOfficial.CurrentRank = rec?.CurrentRank
  formDataEditOfficial.OfficialLevelKH = rec?.OfficialLevelKH
  formDataEditOfficial.serviceCenterID = rec?.serviceCenterID
  //@ts-ignored
  childrenDetails.value = rec?.governStaffChildren
  //@ts-ignored   
  EducationDetails.value = rec?.governStaffQualifitcation
  //@ts-ignored
  governStaffLanuage.value = rec?.governStaffLanuage
  //@ts-ignored
  governStaffWorkingHistoryPublic.value = rec?.governStaffWorkingHistoryPublic
  //@ts-ignored
  governStaffPositionHistory.value = rec?.governStaffPositionHistory
  //@ts-ignored
  governStaffCertificateLevelup.value = rec?.governStaffCertificateLevelup
  //@ts-ignored
  governStaffSituationOutsideOriginalOfficial.value = rec?.governStaffSituationOutsideOriginalOfficial
  //@ts-ignored
  GovernStaffFreeNoSalary.value = rec?.governStaffFreeNoSalary
  //@ts-ignored
  GovernStaffLetterAppreciation.value = rec?.governStaffLetterAppreciation
  //@ts-ignored
  governStaffFineHistory.value = rec?.governStaffFineHistory
  //@ts-ignored
  governStaffWorkingHistoryPrivate.value = rec?.governStaffWorkingHistoryPrivate

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
  const rowProblems: { field: string; label: string }[] = [];
  checkRows(rowProblems);
  validatorEditOfficial.value.clearErrors();
  await validatorEditOfficial.value.validate();
  if (validatorEditOfficial.value.fail() || rowProblems.length) {
    const failed: string[] = validatorEditOfficial.value.getFailedFields?.() ?? [];
    const labels = [
      ...failed.map((f) => STAFF_FIELD_LABELS[f] ?? f),
      ...rowProblems.map((p) => p.label),
    ];
    toast.error({
      message: labels.length
        ? t('message.fillIn', { fields: labels.join(' / ') })
        : validatorEditOfficial.value.getErrorMessage(),
    });
    // Was isErrorEdit — the contract form's flag — so this form never shook.
    isErrorEditOfficial.value = true;
    setTimeout(() => {
      isErrorEditOfficial.value = false;
    }, 1000);
    await nextTick();
    markFieldErrors(rowProblems.map((p) => p.field));
    scrollToFirstError();
    return true;
  }

  const oldImageURL = formDataEditOfficial.photo
  let image: any
  try {
    image = await handleImageUpload()
  } catch (e) {
    // Saving here would store the record with the previous photo, or none,
    // while telling the user it worked.
    toast.error({ message: tr("មិនអាចផ្ទុករូបភាពបានទេ") + "៖ " + (e as any)?.message })
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
    // The server names what it rejected — repeatable rows especially. Say so,
    // and ring the named wrappers rather than leaving a bare "failed".
    const fields: string[] = Array.isArray(error.value?.data?.fields)
      ? error.value.data.fields
      : [];
    const detail = apiErrorMessage(error.value, tr("មិនជោគជ័យ"));
    toast.error({ message: detail === tr("មិនជោគជ័យ") ? tr("មិនជោគជ័យ") : `${tr("មិនជោគជ័យ")} — ${detail}` });
    if (fields.length) {
      const names = fields.map((f) => {
        const m = /^(\w+)\[(\d+)]\.(\w+)$/.exec(f);
        return m ? `row-${m[1]}-${m[3]}-${m[2]}` : f;
      });
      await nextTick();
      markFieldErrors(names);
      scrollToFirstError();
    }
  } else {
    toast.success({
      message: tr("ជោគជ័យ"),
    });
    clearEdit();
  }
  //@ts-ignore
  openisTrues?.value?.closeOffCanvas();
  emit('canvasIsOpen', true)
}

const files = ref();
// Errors deliberately propagate — see composables/useFileUpload.ts. The caller
// aborts the save rather than storing a record whose image silently went
// missing.
const handleImageUpload = async () => {
  if (prop.readOnly) return;
  return await uploadFiles(files.value);
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
        <span class="font-[Moul] text-primary">{{ tr('បញ្ចូលបុគ្គលិកមណ្ឌល') }}</span></template>
      <div class="p-5">
        <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="method of optionsss" :key="method.value"
          v-model="selected" v-bind="method" />
      </div>
      <div class="p-4 overflow-auto font-[battambang]">
        <div v-if="selected !== 'Contract'">
          <div class="text-center">
            <h2 class=" font-[Moul]">{{ tr('ជីវប្រវត្តិមន្ត្រីរាជការ') }}</h2>
          </div>
          <div>
            <h2 class=" font-[Moul]">{{ tr('ក.ព័ត៌មានផ្ទាល់ខ្លួន') }}</h2>
            <TwForm novalidate :name="formNameEditOfficial"
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
                <TwFile v-model="files" :label="tr('រូបភាព ៤x៦')" />
              </div>
              <div class="col-span-4">
              </div>

              <!-- Always shown: every staff member belongs to a centre, and the
                   page that hosts this form passes no centre of its own. -->
              <div class="col-span-12">
                <TwSelect :label="tr('បុគ្គលិករបស់មណ្ឌល')" name="serviceCenterID"
                  v-model="formDataEditOfficial.serviceCenterID" required :items="serviceCenterList"
                  :disabled="readOnly || boundToOneCentre" :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="serviceCenterID" />
              </div>
              <!-- Dormant: no caller passes organisationID today. Independent of the
                   centre select above, which now always shows. -->
              <div class="col-span-12" v-if="prop.organisationID">
                <TwSelect :label="tr('អង្គភាព')" name="organisationID" v-model="formDataEdit.organisationID" required
                  :items="organisationList" :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="organisationID" />
              </div>

              <div class="col-span-12 lg:col-span-4">
                <TwInput :label="tr('គោត្តនាម')" name="lastNameKH" required v-model="formDataEditOfficial.lastNameKH"
                  :placeholder="tr('គោត្តនាមជាភាសារខ្មែរ')" type="text" />
                <CustomErrorMessage name="lastNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-4">
                <TwInput :label="tr('នាមខ្លួន')" name="firstNameKH" required v-model="formDataEditOfficial.firstNameKH"
                  :placeholder="tr('នាមខ្លួនជាភាសារខ្មែរ')" type="text" />
                <CustomErrorMessage name="firstNameKH" />
              </div>
              <div class="col-span-4 ">
                <TwSelect :label="tr('ភេទ')" name="gender" v-model="formDataEditOfficial.gender" required
                  :items="[{ value: 'ប្រុស', label: tr('ប្រុស') }, { value: 'ស្រី', label: tr('ស្រី') }, { value: 'ផ្សេងៗ', label: tr('ផ្សេងៗ') }]"
                  :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="gender" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <TwInput :label="tr('គោត្តនាម')" name="lastNameEN" required v-model="formDataEditOfficial.lastNameEN"
                  :placeholder="tr('គោត្តនាមជាភាសារអង់គ្លេស')" type="text" />
                <CustomErrorMessage name="lastNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <TwInput :label="tr('នាមខ្លួន')" name="firstNameEN" required v-model="formDataEditOfficial.firstNameEN"
                  :placeholder="tr('នាមខ្លួនជាភាសារអង់គ្លេស')" type="text" />
                <CustomErrorMessage name="firstNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <label for="">{{ tr('ថ្ងៃខែឆ្នាំកំណើត') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.DateofBirth" :dayNames="[
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
                <TwInput :label="tr('ជនជាតិ')" name="ethnicity" v-model="formDataEditOfficial.ethnicity" :placeholder="tr('ជនជាតិ')"
                  type="text" />
                <CustomErrorMessage name="ethnicity" />
              </div>
              <div class="col-span-12 lg:col-span-3">
                <TwInput :label="tr('សញ្ជាតិ')" name="nationality" v-model="formDataEditOfficial.nationality"
                  :placeholder="tr('សញ្ជាតិ')" type="text" />
                <CustomErrorMessage name="nationality" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput :label="tr('ទីកន្លែងកំណើត')" name="birthAddress" v-model="formDataEditOfficial.birthAddress"
                  :placeholder="tr('# ផ្លូវ ភូមិ')" type="text" />
                <CustomErrorMessage name="currentAddress" />
              </div>

              <div class="col-span-12 lg:col-span-6">
                <TwSelect :disabled="readOnly" :label="tr('រាជធានី/ខេត្ត')" name="birthCity"
                  v-model="formDataEditOfficial.birthCity" required :items="cityList" :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="type" />
              </div>
              <div class="col-span-12 lg:col-span-6">
                <label for="" class=" font-bold">{{ tr('ខណ្ឌ/ស្រុក') }}</label>
                <ClientOnly>
                  <USelect :disabled="readOnly" name="District" required v-model="formDataEditOfficial.birthDistrict"
                    :options="OfficialtemDistricstList" :placeholder="tr('សូមជ្រើសរើស')" size="lg" />
                </ClientOnly>
                <CustomErrorMessage name="type" />
              </div>


              <div class="col-span-12 lg:col-span-6 ">
                <TwInput :label="tr('អាសយដ្ឋានបច្ចុប្បន្ន')" name="currentAddress"
                  v-model="formDataEditOfficial.currentAddress"
                  :placeholder="tr('# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត')" type="text" />
                <CustomErrorMessage name="currentAddress" />
              </div>
              <div class="col-span-12">
                <label class="font-bold">{{ tr('អាសយដ្ឋានអចិន្ត្រៃយ៍') }}</label>
                <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of AddressOption"
                  :key="methods.value" v-model="selectedAddressOption" v-bind="methods" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="permanentAddress" :label="tr('អាសយដ្ឋានអចិន្ត្រៃយ៍')"
                  v-model="formDataEditOfficial.permanentAddress"
                  :placeholder="tr('# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត')" type="text" />
                <CustomErrorMessage name="permanentAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="email" :label="tr('អ៉ីម៉ែល')" v-model="formDataEditOfficial.email" :placeholder="tr('អ៉ីម៉ែល')"
                  type="text" />
                <CustomErrorMessage name="email" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="telephone" :label="tr('លេខទូរស័ព្ទ')" v-model="formDataEditOfficial.telephone"
                  :placeholder="tr('លេខទូរស័ព្ទ')" type="text" />
                <CustomErrorMessage name="telephone" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="officialID" :label="tr('អត្ថលេខមន្ត្រីរាជការ')" v-model="formDataEditOfficial.officialID"
                  :placeholder="tr('អត្ថលេខមន្ត្រីរាជការ')" type="text" />
                <CustomErrorMessage name="officialID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="CambodianSocialID" :label="tr('លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ')"
                  v-model="formDataEditOfficial.CambodianSocialID" :placeholder="tr('លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ')"
                  type="text" />
                <CustomErrorMessage name="CambodianSocialID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <!-- <TwInput             
                name="sIDValidStart"
                :label="tr('សុពលភាព')"
                v-model="formDataEditOfficial.sIDValidStart"
                :placeholder="tr('សុពលភាព')"
                type="text"
              /> -->
                <label for="">{{ tr('សុពលភាព') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.sIDValidStart" :dayNames="[
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
                :label="tr('ដល់ថ្ងៃ')"
                v-model="formDataEditOfficial.sIDValidEnd"
                :placeholder="tr('ដល់ថ្ងៃ')"
                type="text"
              /> -->
                <label for="">{{ tr('ដល់ថ្ងៃ') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.sIDValidEnd" :dayNames="[
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
                <TwSelect :label="tr('កាយសម្បទា')" name="physical" v-model="formDataEditOfficial.physical" required
                  :items="[{ value: 'Enough', label: tr('គ្រប់គ្រាន់') }, { value: 'Disability', label: tr('ពិការភាព') }, { value: 'Other', label: tr('ប្រភេទពិការ...') }]"
                  :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="physical" />
              </div>
              <hr>
              <div class="col-span-12">
                <label class="font-bold font-[Moul]">{{ tr('ខ - ព័ត៌មានគ្រួសារ') }}</label>
                <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of FamilyInformation"
                  :key="methods.value" v-model="formDataEditOfficial.familyInfo" v-bind="methods" />
              </div>
              <div class="col-span-12">
                <label for="" class="font-[Moul]">{{ tr('ខ.១-ព័ត៌មានប្រពន្ធឬប្តី') }}</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseNameKH" :label="tr('ឈ្មោះប្រពន្ធឬប្តី')" v-model="formDataEditOfficial.spouseNameKH"
                  :placeholder="tr('ឈ្មោះប្រពន្ធឬប្តី')" type="text" />
                <CustomErrorMessage name="spouseNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spuseNameEN" :label="tr('ឈ្មោះជាអក្សរពុម្ពឡាតាំង')" v-model="formDataEditOfficial.spuseNameEN"
                  :placeholder="tr('ឈ្មោះជាអក្សរពុម្ពឡាតាំង')" type="text" />
                <CustomErrorMessage name="spuseNameEN" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <!-- <TwInput             
                name="spouseDateOfBirth"
                :label="tr('ថ្ងៃខែឆ្នាំកំណើត')"
                v-model="formDataEditOfficial.spouseDateOfBirth"
                :placeholder="tr('ថ្ងៃខែឆ្នាំកំណើត')"
                type="text"
              /> -->
                <label for="">{{ tr('ថ្ងៃខែឆ្នាំកំណើត') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.spouseDateOfBirth" :dayNames="[
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
                <TwInput name="spouseSID" :label="tr('លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ')"
                  v-model="formDataEditOfficial.spouseSID" :placeholder="tr('លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ')" type="text" />
                <CustomErrorMessage name="spouseSID" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseBirthAddress" :label="tr('ទីកន្លែងកំណើត')"
                  v-model="formDataEditOfficial.spouseBirthAddress" :placeholder="tr('ទីកន្លែងកំណើត')" type="text" />
                <CustomErrorMessage name="spouseBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseCurrentOccupation" :label="tr('មុខរបរបច្ចុប្បន្ន')"
                  v-model="formDataEditOfficial.spouseCurrentOccupation" :placeholder="tr('មុខរបរបច្ចុប្បន្ន')" type="text" />
                <CustomErrorMessage name="spouseCurrentOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spuseCurrentAddress" :label="tr('កាយសម្បទា')" v-model="formDataEditOfficial.spuseCurrentAddress"
                  :placeholder="tr('ដល់ថ្ងៃ')" type="text" />
                <CustomErrorMessage name="spuseCurrentAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="spouseOrganisationName" :label="tr('ឈ្មោះអង្គភាព')"
                  v-model="formDataEditOfficial.spouseOrganisationName" :placeholder="tr('ឈ្មោះអង្គភាព')" type="text" />
                <CustomErrorMessage name="spouseOrganisationName" />
              </div>
              <div class="col-span-12 ">
                <label for="" class="font-bold">{{ tr('ខ.២-ព័ត៌មានកូន') }}</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-1" v-for="(child, index) in childrenDetails"
                :key="index">
                <div :data-field="`row-childrenDetails-fullnameKH-${index}`">
                  <TwInput :label="index + 1 + tr('. គោត្តនាម និងនាមខ្លួន') + ' '" v-model="child.fullnameKH" required
                    :placeholder="tr('គោត្តនាម និងនាមខ្លួន')" type="text" />
                </div>
                <div :data-field="`row-childrenDetails-gender-${index}`">
                  <TwSelect :label="tr('ភេទ')" v-model="child.gender" required
                    :items="[{ value: 'ប្រុស', label: tr('ប្រុស') }, { value: 'ស្រី', label: tr('ស្រី') }, { value: 'ផ្សេងៗ', label: tr('ផ្សេងៗ') }]"
                    :placeholder="tr('សូមជ្រើសរើស')" />
                </div>
                <div :data-field="`row-childrenDetails-dateofBirth-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំកំណើត') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="child.dateofBirth" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" required :maxDate="new Date()" :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-childrenDetails-occupation-${index}`">
                  <TwInput :label="tr('មុខរបរ')" required v-model="child.occupation" :placeholder="tr('មុខរបរ')" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="childrenDetails.push({
                  fullnameKH: '',
                  gender: '',
                  dateofBirth: '',
                  occupation: '',
                })">{{ tr('បន្ថែមព័ត៌មានកូន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="childrenDetails.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>

              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ខ.៣- ព័ត៌មានឪពុក និងម្តាយបង្កើត') }}</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherFullNameKH" :label="tr('ឪពុកឈ្មោះ')" v-model="formDataEditOfficial.fatherFullNameKH"
                  :placeholder="tr('ឪពុកឈ្មោះ')" type="text" />
                <CustomErrorMessage name="fatherFullNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherBirthAddress" :label="tr('ទីកន្លែងកំណើត')"
                  v-model="formDataEditOfficial.fatherBirthAddress" :placeholder="tr('ទីកន្លែងកំណើត')" type="text" />
                <CustomErrorMessage name="fatherBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="fatherOccupation" :label="tr('មុខរបរបច្ចុប្បន្ន')"
                  v-model="formDataEditOfficial.fatherOccupation" :placeholder="tr('មុខរបរបច្ចុប្បន្ន')" type="text" />
                <CustomErrorMessage name="fatherOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherFullNameKH" :label="tr('ម្តាយឈ្មោះ')" v-model="formDataEditOfficial.motherFullNameKH"
                  :placeholder="tr('ម្តាយឈ្មោះ')" type="text" />
                <CustomErrorMessage name="motherFullNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherBirthAddress" :label="tr('ទីកន្លែងកំណើត')"
                  v-model="formDataEditOfficial.motherBirthAddress" :placeholder="tr('ទីកន្លែងកំណើត')" type="text" />
                <CustomErrorMessage name="motherBirthAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="motherOcupation" :label="tr('មុខរបរបច្ចុប្បន្ន')" v-model="formDataEditOfficial.motherOcupation"
                  :placeholder="tr('មុខរបរបច្ចុប្បន្ន')" type="text" />
                <CustomErrorMessage name="motherOcupation" />
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('គ-ព័ត៌មានទំនាក់ទំនងក្នុងករណីមានអាសន្ន') }}</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECFirstNameKH" :label="tr('នាមខ្លួន')" v-model="formDataEditOfficial.ECFirstNameKH"
                  :placeholder="tr('នាមខ្លួន')" type="text" />
                <CustomErrorMessage name="ECFirstNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECLastNameKH" :label="tr('គោត្តនាម')" v-model="formDataEditOfficial.ECLastNameKH"
                  :placeholder="tr('គោត្តនាម')" type="text" />
                <CustomErrorMessage name="ECLastNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECRelationshipAs" :label="tr('ទំនាក់ទំនងត្រូវជា')"
                  v-model="formDataEditOfficial.ECRelationshipAs" :placeholder="tr('ទំនាក់ទំនងត្រូវជា')" type="text" />
                <CustomErrorMessage name="ECRelationshipAs" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwSelect :label="tr('ភេទ')" name="ECGender" v-model="formDataEditOfficial.ECGender" required
                  :items="[{ value: 'ប្រុស', label: tr('ប្រុស') }, { value: 'ស្រី', label: tr('ស្រី') }, { value: 'ផ្សេងៗ', label: tr('ផ្សេងៗ') }]"
                  :placeholder="tr('សូមជ្រើសរើស')" />
                <CustomErrorMessage name="ECGender" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECOccupation" :label="tr('មុខរបរបច្ចុប្បន្ន')" v-model="formDataEditOfficial.ECOccupation"
                  :placeholder="tr('មុខរបរបច្ចុប្បន្ន')" type="text" />
                <CustomErrorMessage name="ECOccupation" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECAddress" :label="tr('អាសយដ្ឋានបច្ចុប្បន្ន')" v-model="formDataEditOfficial.ECAddress"
                  :placeholder="tr('អាសយដ្ឋានបច្ចុប្បន្ន')" type="text" />
                <CustomErrorMessage name="ECAddress" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="ECTelehpone" :label="tr('លេខទូរស័ព្ទ')" v-model="formDataEditOfficial.ECTelehpone"
                  :placeholder="tr('លេខទូរស័ព្ទ')" type="text" />
                <CustomErrorMessage name="ECTelehpone" />
              </div>
              <div class="col-span-12">
                <label for="" class=" font-[Moul]">{{ tr('ឃ-កំរិតវប្បធម៌ទូទៅ​ ការបណ្តុះបណ្តាលមុខវិជ្ជាជីវៈ​ និងការបណ្តុះបណ្តាលបន្ត') }}</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-2 " v-for="(item, index) in EducationDetails"
                :key="index">
                <div :data-field="`row-EducationDetails-couseLevel-${index}`">
                  <TwInput :label="tr('វគ្គឬកម្រិតសិក្សា')" required v-model="item.couseLevel" :placeholder="tr('វគ្គឬកម្រិតសិក្សា')"
                    type="text" />
                  <CustomErrorMessage name="couseLevel" />
                </div>
                <div :data-field="`row-EducationDetails-SchoolName-${index}`">
                  <TwInput :label="tr('គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល')" required v-model="item.SchoolName"
                    :placeholder="tr('គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល')" type="text" />
                  <CustomErrorMessage name="SchoolName" />
                </div>
                <div :data-field="`row-EducationDetails-SchoolLocation-${index}`">
                  <TwInput :label="tr('រាជធានីខេត្តឬប្រទេស')" required v-model="item.SchoolLocation"
                    :placeholder="tr('រាជធានីខេត្តឬប្រទេស')" type="text" />
                  <CustomErrorMessage name="SchoolLocation" />
                </div>
                <div :data-field="`row-EducationDetails-CertificateLevel-${index}`">
                  <TwInput :label="tr('សញ្ញាបត្រ')" required v-model="item.CertificateLevel" :placeholder="tr('សញ្ញាបត្រ')"
                    type="text" />
                  <CustomErrorMessage name="CertificateLevel" />
                </div>
                <div :data-field="`row-EducationDetails-majoring-${index}`">
                  <TwInput :label="tr('ជំនាញ')" required v-model="item.majoring" :placeholder="tr('ជំនាញ')" type="text" />
                  <CustomErrorMessage name="majoring" />
                </div>
                <div :data-field="`row-EducationDetails-StartDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំចូលសិក្សា') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.StartDate" :dayNames="[
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
                <div :data-field="`row-EducationDetails-finishDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំបញ្ចប់សិក្សា') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.finishDate" :dayNames="[
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
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="EducationDetails.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for="">{{ tr('ង-ភាសារបរទេស(សូមបំពេញនូវកម្រិតចំណេះដឹងភាសាបរទេស​)') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2" v-for="(item, index) in governStaffLanuage"
                :key="index">
                <div :data-field="`row-governStaffLanuage-langName-${index}`">
                  <TwInput :label="tr('ភាសាបរទេស')" required v-model="item.langName" :placeholder="tr('ភាសាបរទេស')" type="text" />
                  <CustomErrorMessage name="langName" />
                </div>
                <div :data-field="`row-governStaffLanuage-read-${index}`">
                  <TwSelect :label="tr('ការអាន')" v-model="item.read" required
                    :items="[{ value: 'good', label: tr('ល្អ') }, { value: 'medium', label: tr('មធ្យម') }, { value: 'bad', label: tr('ខ្សោយ') }]"
                    :placeholder="tr('សូមជ្រើសរើស')" />
                </div>
                <div :data-field="`row-governStaffLanuage-conversation-${index}`">
                  <TwSelect :label="tr('ការសន្ទនា')" v-model="item.conversation" required
                    :items="[{ value: 'good', label: tr('ល្អ') }, { value: 'medium', label: tr('មធ្យម') }, { value: 'bad', label: tr('ខ្សោយ') }]"
                    :placeholder="tr('សូមជ្រើសរើស')" />
                </div>
                <div :data-field="`row-governStaffLanuage-writing-${index}`">
                  <TwSelect :label="tr('ការសរសេរ')" v-model="item.writing" required
                    :items="[{ value: 'good', label: tr('ល្អ') }, { value: 'medium', label: tr('មធ្យម') }, { value: 'bad', label: tr('ខ្សោយ') }]"
                    :placeholder="tr('សូមជ្រើសរើស')" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffLanuage.push({
                  langName: '',
                  read: '',
                  conversation: '',
                  writing: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffLanuage.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ច-ប្រវត្តិការងារ') }}</label>
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <label for="">{{ tr('ថ្ងៃខែឆ្នាំចូលបម្រើក្របខ័ណ្ឌរដ្ឋ') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.DateStartOfficialWork" :dayNames="[
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
                <label for="">{{ tr('ថ្ងៃខែឆ្នាំតាំងស៊ុបក្នុងក្របខ័ណ្ឌរដ្ឋ') }}</label>
                <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEditOfficial.DateWentFullTime" :dayNames="[
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
                <TwInput name="CurrentRank" :label="tr('ឈ្មោះក្របខណ្ឌ')" v-model="formDataEditOfficial.CurrentRank"
                  :placeholder="tr('ឈ្មោះក្របខណ្ឌ')" type="text" />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput name="OfficialLevelKH" :label="tr('ក្របខណ្ឌ ឋានន្តរស័ក្ក​ និងថ្នាក់បច្ចុប្បន្ន')"
                  v-model="formDataEditOfficial.OfficialLevelKH" :placeholder="tr('ក.៣.២')" type="text" />
                <CustomErrorMessage name="OfficialLevelKH" />
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for="">{{ tr('ច.១-មុខតំណែង(សូមបំពេញ​ ពីថ្មីទៅចាស់)') }}</label>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for="">{{ tr('ច.១.១-ក្នុងវិស័យសាធារណៈ') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-2"
                v-for="(item, index) in governStaffWorkingHistoryPublic" :key="index">
                <div :data-field="`row-governStaffWorkingHistoryPublic-DateStartWorking-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំចូលបម្រើការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.DateStartWorking" :dayNames="[
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
                <div :data-field="`row-governStaffWorkingHistoryPublic-DateStopWorking-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែបញ្ចប់ការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.DateStopWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-OgnisationName-${index}`">
                  <TwInput :label="tr('ក្រសួង-ស្ថាប័ន')" v-model="item.OgnisationName" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-Department-${index}`">
                  <TwInput :label="tr('នាយកដ្ឋាន-អង្គភាព')" v-model="item.Department" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-position-${index}`">
                  <TwInput :label="tr('មុខតំណែង')" v-model="item.position" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-SkillInPosition-${index}`">
                  <TwInput :label="tr('ជំនាញ/បច្ចេកទេសក្នុងមុខតំណែង')" v-model="item.SkillInPosition" placeholder=""
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
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffWorkingHistoryPublic.pop()">{{ tr('លុបព័ត៌មាន') }}</UButton>
              </div>
              <div class="col-span-12 font-[Moul]">
                <label for="">{{ tr('ច.១.២-ក្នុងវិស័យឯកជន') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2"
                v-for="(item, index) in governStaffWorkingHistoryPrivate" :key="index">
                <div :data-field="`row-governStaffWorkingHistoryPublic-DateStartWorking-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំចូលបម្រើការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.DateStartWorking" :dayNames="[
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
                <div :data-field="`row-governStaffWorkingHistoryPublic-DateStopWorking-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែបញ្ចប់ការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.DateStopWorking" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-OgnisationName-${index}`">
                  <TwInput :label="tr('គ្រឹះស្ថាន-អង្គភាព')" v-model="item.OgnisationName" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-position-${index}`">
                  <TwInput :label="tr('តួនាទី')" v-model="item.position" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-SkillInPosition-${index}`">
                  <TwInput :label="tr('ជំនាញ/បច្ចេកទេស')" v-model="item.SkillInPosition" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffWorkingHistoryPrivate.push({
                  DateStartWorking: '',
                  DateStopWorking: '',
                  OgnisationName: '',
                  position: '',
                  SkillInPosition: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffWorkingHistoryPrivate.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ច.២-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមវេនជ្រើសរើស អតីតភាព ប្តូរប្រភេទក្របខណ្ឌ និងនិយ័តកម្មថ្នាក់ (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffPositionHistory" :key="index">
                <div :data-field="`row-governStaffPositionHistory-ValidDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែបញ្ចប់ការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.ValidDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffPositionHistory-MinistryName-${index}`">
                  <TwInput :label="tr('ក្រសួង-ស្ថាប័ន')" v-model="item.MinistryName" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffWorkingHistoryPublic-Department-${index}`">
                  <TwInput :label="tr('នាយកដ្ឋាន-អង្គភាព')" v-model="item.Department" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-OfficialSection-${index}`">
                  <TwInput :label="tr('ការិយាល័យ-ផ្នែក')" v-model="item.OfficialSection" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-oldOfficialLevel-${index}`">
                  <TwInput :label="tr('ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ចាស់')" v-model="item.oldOfficialLevel" placeholder=""
                    type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-newOffcialLevel-${index}`">
                  <TwInput :label="tr('ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ថ្មី')" v-model="item.newOffcialLevel" placeholder=""
                    type="text" />
                </div>
                <div :data-field="`row-governStaffPositionHistory-changeTo-${index}`">
                  <TwInput :label="tr('ប្រភេទដំឡើង/ប្តូរ')" v-model="item.changeTo" placeholder="" type="text" />
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
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffPositionHistory.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ច.៣-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមសញ្ញាបត្រ(សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffCertificateLevelup" :key="index">
                <div :data-field="`row-governStaffCertificateLevelup-validatDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែបញ្ចប់ការងារ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.validatDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-EducationDetails-SchoolName-${index}`">
                  <TwInput :label="tr('គ្រឹះស្ថានបណ្តុះបណ្តាល')" v-model="item.SchoolName" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffCertificateLevelup-PlaceStudy-${index}`">
                  <TwInput :label="tr('ទីកន្លែងសិក្សា')" v-model="item.PlaceStudy" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffCertificateLevelup-ReceivedCertificate-${index}`">
                  <TwInput :label="tr('សញ្ញាបត្រទទួលបាន')" v-model="item.ReceivedCertificate" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffCertificateLevelup-OldPosition-${index}`">
                  <TwInput :label="tr('ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ចាស់')" v-model="item.OldPosition" placeholder=""
                    type="text" />
                </div>
                <div :data-field="`row-governStaffCertificateLevelup-NewPosition-${index}`">
                  <TwInput :label="tr('ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ថ្មី')" v-model="item.NewPosition" placeholder=""
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
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffCertificateLevelup.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ច.៤-ស្ថានភាពស្ថិតនៅក្រៅក្របខ័ណ្ឌដើម (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2"
                v-for="(item, index) in governStaffSituationOutsideOriginalOfficial" :key="index">
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-startDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំចាប់ផ្តើម') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.startDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-endDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំបញ្ចប់') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.endDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-OginasationName-${index}`">
                  <TwInput :label="tr('ក្រសួង/ស្ថាប័ន')" v-model="item.OginasationName" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-Position-${index}`">
                  <TwInput :label="tr('មុខដំណែង')" v-model="item.Position" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffSituationOutsideOriginalOfficial.push({
                  startDate: '',
                  endDate: '',
                  OginasationName: '',
                  Position: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffSituationOutsideOriginalOfficial.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ច.៥-ស្ថានភាពស្ថិតនៅក្នុងភាពទំនេរគ្មានបៀវត្ស (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)') }}</label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2"
                v-for="(item, index) in GovernStaffFreeNoSalary" :key="index">
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-startDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំចាប់ផ្តើម') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.startDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-governStaffSituationOutsideOriginalOfficial-endDate-${index}`">
                  <label for="">{{ tr('ថ្ងៃខែឆ្នាំបញ្ចប់') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.endDate" :dayNames="[
                    'Mo',
                    'Tu',
                    'We',
                    'Th',
                    'Fr',
                    'Sa',
                    'Su',
                  ]" position="left" :maxDate="new Date()" required :enableTimePicker="false"></Datepicker>
                </div>
                <div :data-field="`row-GovernStaffFreeNoSalary-Oginisationname-${index}`">
                  <TwInput :label="tr('ក្រសួង/ស្ថាប័ន')" v-model="item.Oginisationname" placeholder="" type="text" />
                </div>
                <div :data-field="`row-GovernStaffFreeNoSalary-NumberofMonthandYear-${index}`">
                  <TwInput :label="tr('ចំនួន(ខែ/ឆ្នាំ)')" v-model="item.NumberofMonthandYear" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="GovernStaffFreeNoSalary.push({
                  startDate: '',
                  endDate: '',
                  Oginisationname: '',
                  NumberofMonthandYear: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="GovernStaffFreeNoSalary.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ឆ-ការលើសរសើរ ឬដាក់វិន័យ') }}</label>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ឆ.១-ការលើសរសើរ (គ្រឿងឥស្សរិយយស មេដាយ ប័ណ្ឌសរសើរ)') }}</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1"
                v-for="(item, index) in GovernStaffLetterAppreciation" :key="index">
                <div :data-field="`row-governStaffLetterAppreciation-letterNumber-${index}`">
                  <TwInput :label="tr('លេខលិខិត')" v-model="item.letterNumber" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffLetterAppreciation-OfficialDate-${index}`">
                  <label for="">{{ tr('កាលបរិច្ចេទ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.OfficialDate" :dayNames="[
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
                <div :data-field="`row-governStaffLetterAppreciation-RequestedOrginsation-${index}`">
                  <TwInput :label="tr('ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)')" v-model="item.RequestedOrginsation"
                    placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffLetterAppreciation-LetterDetails-${index}`">
                  <TwInput :label="tr('បរិយាយ')" v-model="item.LetterDetails" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffLetterAppreciation-TypeReceived-${index}`">
                  <TwInput :label="tr('ប្រភេទ')" v-model="item.TypeReceived" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="GovernStaffLetterAppreciation.push({
                  letterNumber: '',
                  OfficialDate: '',
                  RequestedOrginsation: '',
                  LetterDetails: '',
                  TypeReceived: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="GovernStaffLetterAppreciation.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>
              <div class="col-span-12">
                <label class=" font-[Moul]">{{ tr('ឆ.២-ការដាក់វិន័យ') }}</label>
              </div>
              <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1"
                v-for="(item, index) in governStaffFineHistory" :key="index">
                <div :data-field="`row-governStaffLetterAppreciation-letterNumber-${index}`">
                  <TwInput :label="tr('លេខលិខិត')" v-model="item.letterNumber" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffFineHistory-OffialDate-${index}`">
                  <label for="">{{ tr('កាលបរិច្ចេទ') }}</label>
                  <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="item.OffialDate" :dayNames="[
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
                <div :data-field="`row-governStaffLetterAppreciation-RequestedOrginsation-${index}`">
                  <TwInput :label="tr('ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)')" v-model="item.RequestedOrginsation"
                    placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffLetterAppreciation-LetterDetails-${index}`">
                  <TwInput :label="tr('បរិយាយ')" v-model="item.LetterDetails" placeholder="" type="text" />
                </div>
                <div :data-field="`row-governStaffFineHistory-TypeRecieved-${index}`">
                  <TwInput :label="tr('ប្រភេទ')" v-model="item.TypeRecieved" placeholder="" type="text" />
                </div>
              </div>
              <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users" size="lg" class="px-4" @click="governStaffFineHistory.push({
                  letterNumber: '',
                  OffialDate: '',
                  RequestedOrginsation: '',
                  LetterDetails: '',
                  TypeRecieved: '',
                })">{{ tr('បន្ថែមព័ត៌មាន') }}</UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4"
                  @click="governStaffFineHistory.pop()">{{ tr('លុបព័ត៌មានកូន') }}</UButton>
              </div>

              <div class="col-span-12 lg:col-span-12  flex justify-end gap-1">
                <UButton :ripple="true" color="gray" square type="button" size="lg"
                  class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEditOfficial()">{{ tr('កំណត់ឡើងវិញ') }}</UButton>
                <UButton color="primary" size="lg" class="px-4" type="submit">{{ tr('រក្សាទុក') }}</UButton>
              </div>
            </TwForm>
          </div>
        </div>

        <div v-else>
          <div class="text-center">
            <h2 class="font-[Moul]">{{ tr('ជីវប្រវត្តិសង្ខេប') }}</h2>
          </div>
          <h2 class="font-[Moul]">{{ tr('ក.ព័ត៌មានផ្ទាល់ខ្លួន') }}</h2>
          <TwForm novalidate :name="formNameEdit"
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
              <TwFile v-model="files" :label="tr('រូបភាព ៤x៦')" />
            </div>
            <div class="col-span-4">
            </div>
            <div class="col-span-12">
              <TwSelect :label="tr('បុគ្គលិករបស់មណ្ឌល')" name="serviceCenterID" v-model="formDataEdit.serviceCenterID" required
                :items="serviceCenterList" :disabled="readOnly || boundToOneCentre"
                :placeholder="tr('សូមជ្រើសរើស')" />
              <CustomErrorMessage name="serviceCenterID" />
            </div>
            <!-- Dormant: no caller passes organisationID today. Independent of the
                   centre select above, which now always shows. -->
              <div class="col-span-12" v-if="prop.organisationID">
              <TwSelect :label="tr('អង្គភាព')" name="organisationID" v-model="formDataEdit.organisationID" required
                :items="organisationList" :placeholder="tr('សូមជ្រើសរើស')" />
              <CustomErrorMessage name="organisationID" />
            </div>


            <div class="col-span-12 lg:col-span-3 ">
              <TwInput :label="tr('នាមខ្លួន')" name="firstName" required v-model="formDataEdit.firstName" :placeholder="tr('បញ្ចូលឈ្មោះ')"
                type="text" />
              <CustomErrorMessage name="firstName" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwInput :label="tr('នាមត្រកូល')" name="lastName" required v-model="formDataEdit.lastName" :placeholder="tr('បញ្ចូលនាមត្រកូល')"
                type="text" />
              <CustomErrorMessage name="lastName" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwSelect :label="tr('ភេទ')" name="gender" v-model="formDataEdit.gender" required
                :items="[{ value: 'ប្រុស', label: tr('ប្រុស') }, { value: 'ស្រី', label: tr('ស្រី') }, { value: 'ផ្សេងៗ', label: tr('ផ្សេងៗ') }]"
                :placeholder="tr('សូមជ្រើសរើស')" />
              <CustomErrorMessage name="gender" />
            </div>
            <div class="col-span-12 lg:col-span-3 ">
              <TwInput :label="tr('សញ្ជាតិ')" name="nationality" v-model="formDataEdit.nationality" :placeholder="tr('បញ្ចូលនាមត្រកូល')"
                type="text" />
              <CustomErrorMessage name="nationality" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput :label="tr('អក្សរពុម្ភឡាតាំង')" name="fullnameEN" v-model="formDataEdit.fullnameEN"
                :placeholder="tr('បញ្ចូលនាមត្រកូល')" type="text" />
              <CustomErrorMessage name="fullnameEN" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <label for="">{{ tr('ខែឆ្នាំកំណើត') }}</label>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEdit.dateofbirth" :dayNames="[
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
              <TwInput :label="tr('កម្រិតវប្បធម៌')" name="currentQualification" v-model="formDataEdit.currentQualification"
                :placeholder="tr('បញ្ចូលនាមត្រកូល')" type="text" />
              <CustomErrorMessage name="currentQualification" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <label for="">{{ tr('ខែឆ្នាំកំណើត') }}</label>
              <Datepicker :flow="['year', 'month', 'calendar']" :text-input="true" v-model="formDataEdit.workingPeroidStart" :dayNames="[
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
              <TwInput :label="tr('ទីកន្លែងកំណើត')" name="birthAddress" v-model="formDataEdit.birthAddress"
                :placeholder="tr('# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត')" type="text" />
              <CustomErrorMessage name="birthAddress" />
            </div>
            <div class="col-span-12">
              <label class="font-bold">{{ tr('លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ ឬលិខិតឆ្លងដែន') }}</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of SIDOption"
                :key="methods.value" v-model="SelectSIDOption" v-bind="methods" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-if="SelectSIDOption == SIDOption[0].value">
              <TwInput :label="tr('លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ')" name="sID" v-model="formDataEdit.sID"
                :placeholder="tr('លេខអត្តសញ្ញាណប័ណ្ណខ្មែរ')" type="text" />
              <CustomErrorMessage name="sID" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-else>
              <TwInput :label="tr('លិខិតឆ្លងដែន')" name="passport" v-model="formDataEdit.passport" :placeholder="tr('លិខិតឆ្លងដែន')"
                type="text" />
              <CustomErrorMessage name="passport" />
            </div>
            <div class="col-span-12 ">
              <TwInput :label="tr('ចូលបម្រើការងារជាបុគ្គលិកកិច្ចសន្យានៅ')" name="workingContractAt"
                v-model="formDataEdit.workingContractAt" :placeholder="tr('ចូលបម្រើការងារជាបុគ្គលិកកិច្ចសន្យានៅ')"
                type="text" />
              <CustomErrorMessage name="workingContractAt" />
            </div>
            <div class="col-span-12">
              <label class="font-[Moul]">{{ tr('បទពិសោធន៍ការងារ៖') }}</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="(methods, index) of WorkEXP"
                :key="index" v-model="SelectWorkEXP" v-bind="methods" />
            </div>
            <div class="col-span-12 lg:col-span-6" v-if="SelectWorkEXP == true">
              <TwInput :label="tr('បំពេញការងារជាមន្រ្តីជាប់កិច្ចសន្យានៅ')" name="workingEXPYes" v-model="formDataEdit.workingEXPYes"
                :placeholder="tr('បំពេញការងារជាមន្រ្តីជាប់កិច្ចសន្យានៅ')" type="text" />
              <CustomErrorMessage name="workingEXPYes" />
            </div>
            <div class="col-span-12">
              <h2 class="font-[Moul]">{{ tr('ខ.ព័ត៌មានគ្រួសារ') }}</h2>
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput :label="tr('អាសយដ្ឋានបច្ចុប្បន្ន')" name="familyAddress" v-model="formDataEdit.familyAddress"
                :placeholder="tr('# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត')" type="text" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput :label="tr('លេខទូរស័ព្ទ')" name="familyPhoneNumber" v-model="formDataEdit.familyPhoneNumber"
                :placeholder="tr('លេខទូរស័ព្ទ')" type="text" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput :label="tr('អ៊ីម៉ែល')" name="familyEmail" v-model="formDataEdit.familyEmail" :placeholder="tr('អ៊ីម៉ែល')"
                type="text" />
            </div>

            <div class="col-span-12  flex justify-end gap-1">
              <UButton :ripple="true" color="gray" square type="button" size="lg"
                class=" dark:text-gray-200 dark:!border-gray-800 dark:border" @click="clearEdit()">{{ tr('កំណត់ឡើងវិញ') }}</UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit">{{ tr('រក្សាទុក') }}</UButton>
            </div>
          </TwForm>
        </div>
      </div>
    </TwOffcanvas>
    <TwToast :toasts="useToat" :class="'font-[battambang]'" :position="'bottom-left'" />
  </div>
</template>