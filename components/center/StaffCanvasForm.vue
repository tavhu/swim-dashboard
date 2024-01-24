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
import { type ServiceCenter, type Staff }  from '@prisma/client'
import title from '~/store/data/title'
import Datepicker from "@vuepic/vue-datepicker"
import "@vuepic/vue-datepicker/dist/main.css"
import { string } from 'zod'
  
  const config = useRuntimeConfig()
  const prop = defineProps<{
      openisTrue  : boolean ,          
      readOnly : boolean ,
      id : string | undefined | null,
      serviceCenterID : string | null
  }>()

  const emit = defineEmits<{     
      (event: 'canvasIsOpen', isOpen: boolean): void
    }>()
  let temTitle : any = []

  title.forEach(ele =>{
    temTitle.push({
        label : ele.name,
        value : ele.name
      })
    })
    
    const openisTrues = ref()
    const formRulesEdit = {   
    title : ['string' , 'required'],
    firstName : ['string' , 'required'],
    lastName : ['string' , 'required'],
    gender : ['string'],
    position : ['string'],
    telephone : ['string'],
    email : ['string', 'email'],
    serviceCenterID : ['string','required'],
    }

    const formNameEdit = "centerStaffForm";
    const formDataEdit: {
    [key: string]: any;
    } = reactive({       
    id : prop.id ? prop.id : 'asdf' ,
    title  : null ,
    firstName  : null ,
    lastName  : null ,
    gender  : null ,
    position  : null ,
    telephone  : null ,
    email  : null ,
    serviceCenterID  : prop.serviceCenterID ? prop.serviceCenterID : '' ,
    });

    const toast = useToast()
    const {toasts : useToat} = useToast()    
    const composableForm = useForm();
    const isErrorEdit = ref(false);
    const formEdit = computed(() => composableForm.getForm(formNameEdit));
    const validatorEdit = computed(() => formEdit.value.validator);

    const clearEdit = () => {
      formDataEdit.id   =  null 
      formDataEdit.title   =  null 
      formDataEdit.firstName  =  null 
      formDataEdit.lastName   =  null 
      formDataEdit.gender    =  null 
      formDataEdit.position  =  null 
      formDataEdit.telephone =  null 
      formDataEdit.email    =  null 
      formDataEdit.serviceCenterID  =  null 
    setTimeout(() => {
        validatorEdit.value.clearErrors();
    }, 100) }

  async function submitEdit() {
  if(prop.readOnly) return;
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

  const { error } = await useFetch('/api/center/staff/upsert', {
    method: "POST",
    body: JSON.stringify({
      id : formDataEdit.id,
      title : formDataEdit.title,
      firstName : formDataEdit.firstName,
      lastName : formDataEdit.lastName,
      gender : formDataEdit.gender,
      position : formDataEdit.position,
      telephone : formDataEdit.telephone,
      email : formDataEdit.email,
      serviceCenterID : formDataEdit.serviceCenterID,
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
  
  onMounted(()=>{
    if(prop.openisTrue){
      // console.log(prop.openisTrue)
      openisTrues?.value?.openOffCanvas();
    }
  })

  const { data }  =  await useFetch<{data : ServiceCenter[]}>('/api/center/get',{
  method : 'POST'
  })

  let serviceCenterList : any = []

  data.value?.data.forEach(ele =>{
    serviceCenterList.push({
        label : ele.nameKH,
        value : ele.id
      })
    })

    if(prop.id){
      const { data } = await useFetch<Staff>('/api/center/staff/get', { method : 'POST' , body : JSON.stringify({ id : prop.id})})
      formDataEdit.id = data.value?.id
      formDataEdit.title = data.value?.title
      formDataEdit.firstName = data.value?.firstName
      formDataEdit.lastName = data.value?.lastName
      formDataEdit.gender = data.value?.gender
      formDataEdit.position = data.value?.position
      formDataEdit.telephone = data.value?.telephone
      formDataEdit.email = data.value?.email
      formDataEdit.serviceCenterID = data.value?.serviceCenterID
    }

    const optionsss = [{
        value: 'official',
        label: 'មន្ត្រីរាជការ'
      },{
        value: 'contract',
        label: 'មន្ត្រីកិច្ចសន្យា'
      }]

      const AddressOption = [{
        value  : 'thesame',
        label : 'ដូចអាសយដ្ឋានបច្ចុប្បន្ន' ,
      },
      {
        value  : 'notthesame',
        label : 'មិនដូចអាសយដ្ឋានបច្ចុប្បន្ន' ,
      },
    ]
      const FamilyInformation = [{
        value  : 'single',
        label : 'នៅលីវ' ,
      },
      {
        value  : 'married',
        label : 'រៀបការហើយ' ,
      },
      {
        value  : 'widow',
        label : 'មេម៉ាយ/ពោះម៉ាយ' ,
      },
    ]
  
    const selectedAddressOption = ref(' ') 
    const selected = ref('official')    

  const formRulesEditOfficial = {     
    firstNameKH : ['string','required'],
    lastNameKH : ['string','required'],
    firstNameEN : ['string','required'],
    lastNameEN : ['string','required'],   
    serviceCenterID : ['string','required'],
    }
    const formNameEditOfficial = "centerStaffFormOfficial";
    const formDataEditOfficial: {
    [key: string]: any;
    } = reactive({       
    id : prop.id ? prop.id : 'asdf' ,
    photo : '' ,
    firstNameKH : '' ,
    lastNameKH : '' ,
    firstNameEN : '' ,
    lastNameEN : '' ,
    gender : '' ,
    DateofBirth : '' ,
    ethnicity : '' ,
    nationality : '' ,
    birthAddress : '' ,
    permanentAddress : '',
    currentAddress : '' ,
    telephone : '' ,
    email : '' ,
    officialID : '' ,
    CambodianSocialID : '' ,
    sIDValidStart : '' ,
    sIDValidEnd : '' ,
    physical : '' ,
    familyInfo : '' ,
    spouseNameKH : '' ,
    spuseNameEN : '' ,
    spouseDateOfBirth : '' ,
    spouseSID : '' ,
    spouseBirthAddress : '' ,
    spouseCurrentOccupation : '' ,
    spouseOrganisationName : '' ,
    spuseCurrentAddress : '' ,
    fatherFullNameKH : '' ,
    FatherOccupation : '' ,
    fatherBrithAddress : '' ,
    MotherOcupation : '' ,
    motherFullNameKH : '' ,
    motherBrirthAddress : '' ,
    ECFirstNameKH : '' ,
    ECLastNameKH : '' ,
    ECGender : '' ,
    ECRelationshipAs : '' ,
    ECOccupation : '' ,
    ECAddress : '' ,
    ECTelehpone : '' ,
    DateStartOfficialWork : '' ,
    DateWentFullTime : '' ,
    CurrentRank : '' ,
    OfficialLevelKH : '' ,
    serviceCenterID  : prop.serviceCenterID ? prop.serviceCenterID : '' ,
    });

    const isErrorEditOfficial = ref(false);
    const formEditOfficial = computed(() => composableForm.getForm(formNameEditOfficial));
    const validatorEditOfficial = computed(() => formEditOfficial.value.validator);

    const clearEditOfficial = () => {
      formDataEditOfficial.id   =  null 
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
      formDataEditOfficial.currentAddress = null
      formDataEditOfficial.permanentAddress = null
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
      formDataEditOfficial.spouseCurrentOccupation = null
      formDataEditOfficial.spouseOrganisationName = null
      formDataEditOfficial.spuseCurrentAddress = null
      formDataEditOfficial.fatherFullNameKH = null
      formDataEditOfficial.FatherOccupation = null
      formDataEditOfficial.fatherBrithAddress = null
      formDataEditOfficial.MotherOcupation = null
      formDataEditOfficial.motherFullNameKH = null
      formDataEditOfficial.motherBrirthAddress = null
      formDataEditOfficial.ECFirstNameKH = null
      formDataEditOfficial.ECLastNameKH = null
      formDataEditOfficial.ECGender = null
      formDataEditOfficial.ECRelationshipAs = null
      formDataEditOfficial.ECOccupation = null
      formDataEditOfficial.ECAddress = null
      formDataEditOfficial.ECTelehpone = null
      formDataEditOfficial.DateStartOfficialWork = null
      formDataEditOfficial.DateWentFullTime = null
      formDataEditOfficial.CurrentRank = null
      formDataEditOfficial.OfficialLevelKH = null

    setTimeout(() => {
      validatorEditOfficial.value.clearErrors();
    }, 100) }

    async function submitEditOfficial() {
      if(prop.readOnly) return;
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
      let image : any
      image = await handleImageUpload() 
      if(image){
        formDataEditOfficial.photo = image[0]
        //delete old profile from server storage
        await useFetch('/api/deleteFile', { method : 'POST' , body : JSON.stringify({imgURL : oldImageURL})})
      }


      const { error } = await useFetch('/api/center/staffOfficial/upsert', {
        method: "POST",
        body: JSON.stringify({
          id : formDataEditOfficial.id,
          photo : formDataEditOfficial.photo , 
          firstNameKH : formDataEditOfficial.firstNameKH , 
          lastNameKH : formDataEditOfficial.lastNameKH , 
          firstNameEN : formDataEditOfficial.firstNameEN , 
          lastNameEN : formDataEditOfficial.lastNameEN , 
          gender : formDataEditOfficial.gender , 
          DateofBirth : formDataEditOfficial.DateofBirth , 
          ethnicity : formDataEditOfficial.ethnicity , 
          nationality : formDataEditOfficial.nationality , 
          birthAddress : formDataEditOfficial.birthAddress , 
          currentAddress : formDataEditOfficial.currentAddress , 
          permanentAddress : formDataEditOfficial.permanentAddress,
          telephone : formDataEditOfficial.telephone , 
          email : formDataEditOfficial.email , 
          officialID : formDataEditOfficial.officialID , 
          CambodianSocialID : formDataEditOfficial.CambodianSocialID , 
          sIDValidStart : formDataEditOfficial.sIDValidStart , 
          sIDValidEnd : formDataEditOfficial.sIDValidEnd , 
          physical : formDataEditOfficial.physical , 
          familyInfo : formDataEditOfficial.familyInfo , 
          spouseNameKH : formDataEditOfficial.spouseNameKH , 
          spuseNameEN : formDataEditOfficial.spuseNameEN , 
          spouseDateOfBirth : formDataEditOfficial.spouseDateOfBirth , 
          spouseSID : formDataEditOfficial.spouseSID , 
          spouseBirthAddress : formDataEditOfficial.spouseBirthAddress , 
          spouseCurrentOccupation : formDataEditOfficial.spouseCurrentOccupation , 
          spouseOrganisationName : formDataEditOfficial.spouseOrganisationName , 
          spuseCurrentAddress : formDataEditOfficial.spuseCurrentAddress , 
          fatherFullNameKH : formDataEditOfficial.fatherFullNameKH , 
          FatherOccupation : formDataEditOfficial.FatherOccupation , 
          fatherBrithAddress : formDataEditOfficial.fatherBrithAddress , 
          MotherOcupation : formDataEditOfficial.MotherOcupation , 
          motherFullNameKH : formDataEditOfficial.motherFullNameKH , 
          motherBrirthAddress : formDataEditOfficial.motherBrirthAddress , 
          ECFirstNameKH : formDataEditOfficial.ECFirstNameKH , 
          ECLastNameKH : formDataEditOfficial.ECLastNameKH , 
          ECGender : formDataEditOfficial.ECGender , 
          ECRelationshipAs : formDataEditOfficial.ECRelationshipAs , 
          ECOccupation : formDataEditOfficial.ECOccupation , 
          ECAddress : formDataEditOfficial.ECAddress , 
          ECTelehpone : formDataEditOfficial.ECTelehpone , 
          DateStartOfficialWork : formDataEditOfficial.DateStartOfficialWork , 
          DateWentFullTime : formDataEditOfficial.DateWentFullTime , 
          CurrentRank : formDataEditOfficial.CurrentRank , 
          OfficialLevelKH : formDataEditOfficial.OfficialLevelKH , 
          serviceCenterID : formDataEditOfficial.serviceCenterID,
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

    const files = ref();
    const handleImageUpload = async () => {  
      if(prop.readOnly) return;
      if (!files.value || files.value?.length == 0) return false;
      try {
        const fd = new FormData();
        Array.from(files.value).forEach((file, index) => {
          //@ts-ignore
          fd.append(index, file);
        });

        const { data } = await useFetch("/api/user/upload",{
          method: "POST",
          body: fd,
        });

        console.log("data from backend is ", data.value);   
        return data.value
      } catch (error) {
        console.log(error);
      }
    };

    watch(selectedAddressOption,()=>{      
      if(AddressOption[0]?.value == selectedAddressOption.value){
        formDataEditOfficial.permanentAddress = formDataEditOfficial.currentAddress
      }else if(AddressOption.at(1)?.value == selectedAddressOption.value){
        formDataEditOfficial.permanentAddress = ''
      }
    })


    const childrenDetails = ref( Array({
      fullnameKH : '',
      gender : '',
      dateofBirth : '',
      occupation : ''
    }))

    const EducationDetails = ref(Array({
      couseLevel: '',
      SchoolName: '',
      SchoolLocation : '', 
      CertificateLevel : '', 
      majoring : '', 
      StartDate : '', 
      finishDate : '', 
    }))
    const governStaffLanuage = ref(Array({
      langName : '',
      read : '',
      conversation : '',
      writing : '',
    }))
    const governStaffWorkingHistoryPublic = ref(Array({
      DateStartWorking : '',
      DateStopWorking : '',
      OgnisationName : '',
      Department : '',
      position : '',
      SkillInPosition : '',
    }))

    const governStaffWorkingHistoryPrivate = ref(Array({
      DateStartWorking : '',
      DateStopWorking : '',
      OgnisationName : '',
      position : '',
      SkillInPosition : '',
    }))
    const governStaffPositionHistory = ref(Array({
      ValidDate : '',
      MinistryName : '',
      Department : '',
      OfficialSection : '',
      oldOfficialLevel : '',
      newOffcialLevel : '',
      changeTo : '',
    })) 
    const governStaffCertificateLevelup = ref(Array({
      validatDate : '',
      SchoolName : '',
      PlaceStudy : '',
      ReceivedCertificate : '',
      OldPosition : '',
      NewPosition : '',
    })) 
    const governStaffSituationOutsideOriginalOfficial = ref(Array({
      startDate : '',
      endDate : '',
      OginasationName : '',
      Position : '',
    })) 
    const GovernStaffFreeNoSalary = ref(Array({
     startDate : '',
     endDate : '',
     Oginisationname : '',
     NumberofMonthandYear : '',
    })) 
    const GovernStaffLetterAppreciation = ref(Array({
     letterNumber : '', 
     OfficialDate : '', 
     RequestedOrginsation : '', 
     LetterDetails : '', 
     TypeReceived : '', 
    })) 
    const governStaffFineHistory = ref(Array({
     letterNumber : '', 
     OffialDate : '', 
     RequestedOrginsation : '', 
     LetterDetails : '', 
     TypeRecieved : '', 
    })) 
</script>

<template>  
<div>

 
      <TwOffcanvas position="right" width="800px" ref="openisTrues">
      <template #headerTitle>
        <span class="font-[Moul] text-primary"> បញ្ចូលបុគ្គលិកមណ្ឌល </span></template
      >     
      <div class="p-5" >
        <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="method of optionsss" :key="method.value" v-model="selected" v-bind="method" />      
      </div>        
      <div class="p-4 overflow-auto font-[battambang]">        
        <div v-if="selected == optionsss[0].value">         
          <div class="text-center">
            <h2 class="font-semibold">
            ជីវប្រវត្តិមន្ត្រីរាជការ
           </h2>
          </div>
          <div>
            <h2 class="font-bold">
              ក.ព័ត៌មានផ្ទាល់ខ្លួន
            </h2>
            <TwForm
            :name="formNameEditOfficial"
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
            :class="{
              'tw-shake': isErrorEditOfficial,
            }"
            :rules="formRulesEditOfficial"
            @submit="submitEditOfficial()"
            :custom-field-name="{
              roleName: 'ឈ្មោះតួនាទី',
              roleDescription: 'ពិពណ៌នាតួនាទី',
            }"
          >
          <div class="col-span-3">

          </div>
          <div class="col-span-12   lg:col-span-5">          
              <div class="vt-relative vt-col-span-12 lg:col-span-6  vt-flex vt-items-center vt-justify-center">
                <div class="vt-relative vt-w-96">
                  <img :src="config.public.origin + '/' + (formDataEditOfficial.logo ? formDataEditOfficial.logo : '') "  :class="(files?.length > 0 ? ' hidden '  : ' ')  " alt="">
                </div>
              </div>
              <TwFile v-model="files" label="រូបភាព ៤x៦" />
            </div>
            <div class="col-span-4">

            </div>
             <div class="col-span-12" >
                <TwSelect                           
                  label="បុគ្គលិករបស់មណ្ឌល"
                  name="serviceCenterID"            
                  v-model="formDataEditOfficial.serviceCenterID"            
                  required                    
                  :items="serviceCenterList"
                  placeholder="សូមជ្រើសរើស"           
                />
                <CustomErrorMessage name="serviceCenterID" />            
              </div>  
            <div class="col-span-12 lg:col-span-4">
              <TwInput
                label="គោត្តនាម"
                name="lastNameKH"
                v-model="formDataEditOfficial.lastNameKH"
                placeholder="គោត្តនាមជាភាសារខ្មែរ"
                type="text"
              />
              <CustomErrorMessage name="lastNameKH" />
            </div>
            <div class="col-span-12 lg:col-span-4">
              <TwInput
                label="នាមខ្លួន"
                name="firstNameKH"
                v-model="formDataEditOfficial.firstNameKH"
                placeholder="នាមខ្លួនជាភាសារខ្មែរ"
                type="text"
              />
              <CustomErrorMessage name="firstNameKH" />
            </div>                        
            <div class="col-span-4 " >
              <TwSelect                           
                label="ភេទ"
                name="formDataEditOfficialgender"            
                v-model="formDataEditOfficial.gender"            
                required                    
                :items="[{value : 'ប្រុស', label: 'ប្រុស' } , { value : 'ស្រី' , label : 'ស្រី'}, { value : 'ផ្សេងៗ' , label : 'ផ្សេងៗ'}]"
                placeholder="សូមជ្រើសរើស"           
              />
              <CustomErrorMessage name="formDataEditOfficialgender" />            
          </div>  
          <div class="col-span-12 lg:col-span-6">
              <TwInput
                label="គោត្តនាម"
                name="lastNameEN"
                v-model="formDataEditOfficial.lastNameEN"
                placeholder="គោត្តនាមជាភាសារអង់គ្លេស"
                type="text"
              />
              <CustomErrorMessage name="lastNameEN" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <TwInput
                label="នាមខ្លួន"
                name="firstNameEN"
                v-model="formDataEditOfficial.firstNameEN"
                placeholder="នាមខ្លួនជាភាសារអង់គ្លេស"
                type="text"
              />
              <CustomErrorMessage name="firstNameEN" />
            </div>
            <div class="col-span-12 lg:col-span-6">
              <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
              <Datepicker
                v-model="formDataEditOfficial.DateofBirth"
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

              <CustomErrorMessage name="DateofBirth" />
            </div>
            <div class="col-span-12 lg:col-span-3">
              <TwInput
                label="ជនជាតិ"
                name="ethnicity"
                v-model="formDataEditOfficial.ethnicity"
                placeholder="ជនជាតិ"
                type="text"
              />
              <CustomErrorMessage name="ethnicity" />
            </div>
            <div class="col-span-12 lg:col-span-3">
              <TwInput
                label="សញ្ជាតិ"
                name="nationality"
                v-model="formDataEditOfficial.nationality"
                placeholder="សញ្ជាតិ"
                type="text"
              />
              <CustomErrorMessage name="nationality" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="ទីកន្លែងកំណើត"
                name="birthAddress"
                v-model="formDataEditOfficial.birthAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="currentAddress" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="អាសយដ្ឋានបច្ចុប្បន្ន"
                name="currentAddress"
                v-model="formDataEditOfficial.currentAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="currentAddress" />
            </div>
            <div class="col-span-12" >
              <label class="font-bold">អាសយដ្ឋានអចិន្ត្រៃយ៍</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of AddressOption" :key="methods.value" v-model="selectedAddressOption" v-bind="methods" />      
            </div>  
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="permanentAddress"
                label="អាសយដ្ឋានអចិន្ត្រៃយ៍"
                v-model="formDataEditOfficial.permanentAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="permanentAddress" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="email"
                label="អ៉ីម៉ែល"
                v-model="formDataEditOfficial.email"
                placeholder="អ៉ីម៉ែល"
                type="text"
              />
              <CustomErrorMessage name="email" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="telephone"
                label="លេខទូរស័ព្ទ"
                v-model="formDataEditOfficial.telephone"
                placeholder="លេខទូរស័ព្ទ"
                type="text"
              />
              <CustomErrorMessage name="telephone" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="officialID"
                label="អត្ថលេខមន្ត្រីរាជការ"
                v-model="formDataEditOfficial.officialID"
                placeholder="អត្ថលេខមន្ត្រីរាជការ"
                type="text"
              />
              <CustomErrorMessage name="officialID" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="CambodianSocialID"
                label="លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ"
                v-model="formDataEditOfficial.CambodianSocialID"
                placeholder="លេខអត្តសញ្ញាណប័ណ្ណសញ្ញាតិខ្មែរ"
                type="text"
              />
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
               <Datepicker
                  v-model="formDataEditOfficial.sIDValidStart"
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
              <Datepicker
                    v-model="formDataEditOfficial.sIDValidEnd"
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
              <CustomErrorMessage name="sIDValidEnd" />
            </div>
            <div class="col-span-12 lg:col-span-6 " >
                <TwSelect                           
                  label="កាយសម្បទា"
                  name="physical"            
                  v-model="formDataEditOfficial.physical"            
                  required                    
                  :items="[{ value: 'Enough', label: 'គ្រប់គ្រាន់' }, { value: 'Disability', label: 'ពិការភាព' }, { value: 'Other', label: 'ប្រភេទពិការ...' }]"
                  placeholder="សូមជ្រើសរើស"           
                />
                <CustomErrorMessage name="physical" />            
            </div>  
            <hr>
            <div class="col-span-12" >
                <label class="font-bold">ខ - ព័ត៌មានគ្រួសារ</label>
                <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of FamilyInformation" :key="methods.value" v-model="formDataEditOfficial.familyInfo" v-bind="methods" />      
              </div> 
            <div class="col-span-12">
              <label for="" class="font-bold"> ខ.១-ព័ត៌មានប្រពន្ធឬប្តី</label>
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spouseNameKH"
                label="ឈ្មោះប្រពន្ធឬប្តី"
                v-model="formDataEditOfficial.spouseNameKH"
                placeholder="ឈ្មោះប្រពន្ធឬប្តី"
                type="text"
              />
              <CustomErrorMessage name="spouseNameKH" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spuseNameEN"
                label="ឈ្មោះជាអក្សរពុម្ពឡាតាំង"
                v-model="formDataEditOfficial.spuseNameEN"
                placeholder="ឈ្មោះជាអក្សរពុម្ពឡាតាំង"
                type="text"
              />
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
               <Datepicker
                  v-model="formDataEditOfficial.spouseDateOfBirth"
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
                  :maxDate="new Date()"
                  required
                  :enableTimePicker="false"></Datepicker>
              <CustomErrorMessage name="spouseDateOfBirth" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spouseSID"
                label="លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ"
                v-model="formDataEditOfficial.spouseSID"
                placeholder="លេខអត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ"
                type="text"
              />
              <CustomErrorMessage name="spouseSID" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spouseBirthAddress"
                label="ទីកន្លែងកំណើត"
                v-model="formDataEditOfficial.spouseBirthAddress"
                placeholder="ទីកន្លែងកំណើត"
                type="text"
              />
              <CustomErrorMessage name="spouseBirthAddress" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spouseCurrentOccupation"
                label="មុខរបរបច្ចុប្បន្ន"
                v-model="formDataEditOfficial.spouseCurrentOccupation"
                placeholder="មុខរបរបច្ចុប្បន្ន"
                type="text"
              />
              <CustomErrorMessage name="spouseCurrentOccupation" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
                <TwInput             
                  name="spuseCurrentAddress"
                  label="កាយសម្បទា"
                  v-model="formDataEditOfficial.spuseCurrentAddress"
                  placeholder="ដល់ថ្ងៃ"
                  type="text"
                />
                <CustomErrorMessage name="spuseCurrentAddress" />
              </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="spouseOrganisationName"
                label="ឈ្មោះអង្គភាព"
                v-model="formDataEditOfficial.spouseOrganisationName"
                placeholder="ឈ្មោះអង្គភាព"
                type="text"
              />
              <CustomErrorMessage name="spouseOrganisationName" />
            </div>
            <div class="col-span-12 ">
              <label for="" class="font-bold"> ខ.២-ព័ត៌មានកូន </label>
            </div>
            <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-1" v-for="(child,index) in childrenDetails" :key="child.fullnameKH">
              <div>
                <TwInput             
                  :label=" index+1 + '. គោត្តនាម និងនាមខ្លួន '"
                  v-model="child.fullnameKH"
                  required
                  placeholder="គោត្តនាម និងនាមខ្លួន"
                  type="text"
                />
              </div>
               <div >
                <TwSelect                           
                  label="ភេទ"
                  v-model="child.gender"            
                  required                    
                  :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                  placeholder="សូមជ្រើសរើស"           
                />
                </div> 
                <div>
                  <label for=""> ថ្ងៃខែឆ្នាំកំណើត </label>
                   <Datepicker
                    v-model="child.dateofBirth"
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
                </div>
                <div>
                  <TwInput             
                    label="មុខរបរ"
                    required
                    v-model="child.occupation"
                    placeholder="មុខរបរ"
                    type="text"
                  />
                </div>
            </div>
            <div class="col-span-12">
              <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="childrenDetails.push({fullnameKH : '',
                gender : '',
                dateofBirth : '',
                occupation : ''})" > បន្ថែមព័ត៌មានកូន  </UButton>
                <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="childrenDetails.pop()" > លុបព័ត៌មានកូន </UButton>
            </div>
          
            <div class="col-span-12">
              <label class="font-bold"> ខ.៣- ព័ត៌មានឪពុក និងម្តាយបង្កើត</label>
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="fatherFullNameKH"
                label="ឪពុកឈ្មោះ"
                v-model="formDataEditOfficial.fatherFullNameKH"
                placeholder="ឪពុកឈ្មោះ"
                type="text"
              />
              <CustomErrorMessage name="fatherFullNameKH" />
            </div>
             <div class="col-span-12 lg:col-span-6 ">
                <TwInput             
                  name="fatherBrithAddress"
                  label="ទីកន្លែងកំណើត"
                  v-model="formDataEditOfficial.fatherBrithAddress"
                  placeholder="ទីកន្លែងកំណើត"
                  type="text"
                />
                <CustomErrorMessage name="fatherBrithAddress" />
              </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="FatherOccupation"
                label="មុខរបរបច្ចុប្បន្ន"
                v-model="formDataEditOfficial.FatherOccupation"
                placeholder="មុខរបរបច្ចុប្បន្ន"
                type="text"
              />
              <CustomErrorMessage name="FatherOccupation" />
            </div>
             <div class="col-span-12 lg:col-span-6 ">
                <TwInput             
                  name="motherFullNameKH"
                  label="ម្តាយឈ្មោះ"
                  v-model="formDataEditOfficial.motherFullNameKH"
                  placeholder="ម្តាយឈ្មោះ"
                  type="text"
                />
                <CustomErrorMessage name="motherFullNameKH" />
              </div>
              <div class="col-span-12 lg:col-span-6 ">
                <TwInput             
                  name="motherBrirthAddress"
                  label="ទីកន្លែងកំណើត"
                  v-model="formDataEditOfficial.motherBrirthAddress"
                  placeholder="ទីកន្លែងកំណើត"
                  type="text"
                />
                <CustomErrorMessage name="motherBrirthAddress" />
              </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="MotherOcupation"
                label="មុខរបរបច្ចុប្បន្ន"
                v-model="formDataEditOfficial.MotherOcupation"
                placeholder="មុខរបរបច្ចុប្បន្ន"
                type="text"
              />
              <CustomErrorMessage name="MotherOcupation" />
            </div>
            <div class="col-span-12">
              <label class="font-bold"> គ-ព័ត៌មានទំនាក់ទំនងក្នុងករណីមានអាសន្ន </label>
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="ECFirstNameKH"
                label="នាមខ្លួន"
                v-model="formDataEditOfficial.ECFirstNameKH"
                placeholder="នាមខ្លួន"
                type="text"
              />
              <CustomErrorMessage name="ECFirstNameKH" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="ECLastNameKH"
                label="គោត្តនាម"
                v-model="formDataEditOfficial.ECLastNameKH"
                placeholder="គោត្តនាម"
                type="text"
              />
              <CustomErrorMessage name="ECLastNameKH" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
                <TwInput             
                  name="ECRelationshipAs"
                  label="ទំនាក់ទំនងត្រូវជា"
                  v-model="formDataEditOfficial.ECRelationshipAs"
                  placeholder="ទំនាក់ទំនងត្រូវជា"
                  type="text"
                />
                <CustomErrorMessage name="ECRelationshipAs" />
              </div>
            <div class="col-span-12 lg:col-span-6 ">
               <TwSelect                           
                label="ភេទ"
                name="ECGender"            
                v-model="formDataEditOfficial.ECGender"            
                required                    
                :items="[{ value: 'ប្រុស', label: 'ប្រុស' }, { value: 'ស្រី', label: 'ស្រី' }, { value: 'ផ្សេងៗ', label: 'ផ្សេងៗ' }]"
                placeholder="សូមជ្រើសរើស"           
              />
              <CustomErrorMessage name="ECGender" />   
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="ECOccupation"
                label="មុខរបរបច្ចុប្បន្ន"
                v-model="formDataEditOfficial.ECOccupation"
                placeholder="មុខរបរបច្ចុប្បន្ន"
                type="text"
              />
              <CustomErrorMessage name="ECOccupation" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="ECAddress"
                label="អាសយដ្ឋានបច្ចុប្បន្ន"
                v-model="formDataEditOfficial.ECAddress"
                placeholder="អាសយដ្ឋានបច្ចុប្បន្ន"
                type="text"
              />
              <CustomErrorMessage name="ECAddress" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="ECTelehpone"
                label="លេខទូរស័ព្ទ"
                v-model="formDataEditOfficial.ECTelehpone"
                placeholder="លេខទូរស័ព្ទ"
                type="text"
              />
              <CustomErrorMessage name="ECTelehpone" />
            </div>
            <div class="col-span-12">
              <label for="" class="font-semibold"> ឃ-កំរិតវប្បធម៌ទូទៅ​ ការបណ្តុះបណ្តាលមុខវិជ្ជាជីវៈ​ និងការបណ្តុះបណ្តាលបន្ត</label>
            </div>
            <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-4 gap-2 " v-for="item in EducationDetails" :key="item.SchoolName">
              <div>
                <TwInput             
                  label="វគ្គឬកម្រិតសិក្សា"
                  required
                  v-model="item.couseLevel"
                  placeholder="វគ្គឬកម្រិតសិក្សា"
                  type="text"
                />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div>
                <TwInput             
                  label="គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល"
                  required
                  v-model="item.couseLevel"
                  placeholder="គ្រឹះស្ថានសិក្សាបណ្តុះបណ្តាល"
                  type="text"
                />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div>
                <TwInput             
                  label="រាជធានីខេត្តឬប្រទេស"
                  required
                  v-model="item.SchoolLocation"
                  placeholder="រាជធានីខេត្តឬប្រទេស"
                  type="text"
                />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div>
                <TwInput             
                  label="សញ្ញាបត្រ"
                  required
                  v-model="item.CertificateLevel"
                  placeholder="សញ្ញាបត្រ"
                  type="text"
                />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div>
                <TwInput             
                  label="ជំនាញ"
                  required
                  v-model="item.majoring"
                  placeholder="ជំនាញ"
                  type="text"
                />
                <CustomErrorMessage name="CurrentRank" />
              </div>
              <div>
                <label for="">ថ្ងៃខែឆ្នាំចូលសិក្សា</label>
                 <Datepicker
                      v-model="item.StartDate"
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
                <CustomErrorMessage name="DateStartOfficialWork" />
              </div>
              <div>
                <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់សិក្សា</label>
                 <Datepicker
                      v-model="item.finishDate"
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
                <CustomErrorMessage name="DateStartOfficialWork" />
              </div>
            </div>
            <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="EducationDetails.push({
                  couseLevel : '',
                  SchoolName : '',
                  SchoolLocation : '',
                  CertificateLevel : '',
                  majoring : '',
                  StartDate : '',
                  finishDate : '',
                })" > បន្ថែមព័ត៌មាន  </UButton>
                  <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="EducationDetails.pop()" > លុបព័ត៌មានកូន </UButton>
            </div>
            <div class="col-span-12">
              <label for=""> ង-ភាសារបរទេស(សូមបំពេញនូវកម្រិតចំណេះដឹងភាសាបរទេស​)</label>
            </div>
            <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2" v-for="item in governStaffLanuage" :key="item.langName" >
                <div>
                  <TwInput             
                    label="ភាសាបរទេស"
                    required
                    v-model="item.langName"
                    placeholder="ភាសាបរទេស"
                    type="text"
                  />
                  <CustomErrorMessage name="CurrentRank" />
                </div>
                <div >
                 <TwSelect                           
                  label="ការអាន"       
                  v-model="item.read"            
                  required                    
                  :items="[{ value: 'good', label: 'ល្អ' },{ value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                  placeholder="សូមជ្រើសរើស"           
                />
              </div>
              <div >
                   <TwSelect                           
                    label="ការសន្ទនា"       
                    v-model="item.conversation"            
                    required                    
                    :items="[{ value: 'good', label: 'ល្អ' }, { value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                    placeholder="សូមជ្រើសរើស"           
                  />
                </div>
                <div >
                   <TwSelect                           
                    label="ការសរសេរ"       
                    v-model="item.writing"            
                    required                    
                    :items="[{ value: 'good', label: 'ល្អ' }, { value: 'medium', label: 'មធ្យម' }, { value: 'bad', label: 'ខ្សោយ' }]"
                    placeholder="សូមជ្រើសរើស"           
                  />
                </div>
            </div>
            <div class="col-span-12">
                <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffLanuage.push({
                  langName : '',
                  read : '',
                  conversation : '',
                  writing : '',
                })" > បន្ថែមព័ត៌មាន  </UButton>
                  <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffLanuage.pop()" > លុបព័ត៌មានកូន </UButton>
            </div>
            <div class="col-span-12">
              <label class="font-bold"> ច-ប្រវត្តិការងារ</label>
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើក្របខ័ណ្ឌរដ្ឋ</label>
               <Datepicker
                    v-model="formDataEditOfficial.DateStartOfficialWork"
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
              <CustomErrorMessage name="DateStartOfficialWork" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <label for="">ថ្ងៃខែឆ្នាំតាំងស៊ុបក្នុងក្របខ័ណ្ឌរដ្ឋ</label>
               <Datepicker
                    v-model="formDataEditOfficial.DateWentFullTime"
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
                    :maxDate="new Date()"
                    required
                    :enableTimePicker="false"></Datepicker>
              <CustomErrorMessage name="DateWentFullTime" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="CurrentRank"
                label="ឈ្មោះក្របខណ្ឌ"
                v-model="formDataEditOfficial.CurrentRank"
                placeholder="ឈ្មោះក្របខណ្ឌ"
                type="text"
              />
              <CustomErrorMessage name="CurrentRank" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput             
                name="OfficialLevelKH"
                label="ក្របខណ្ឌ ឋានន្តរស័ក្ក​ និងថ្នាក់បច្ចុប្បន្ន"
                v-model="formDataEditOfficial.OfficialLevelKH"
                placeholder="ក.៣.២"
                type="text"
              />
              <CustomErrorMessage name="OfficialLevelKH" />
            </div>
            <div class="col-span-12">
              <label for=""> ច.១-មុខតំណែង(សូមបំពេញ​ ពីថ្មីទៅចាស់) </label>
            </div>
            <div class="col-span-12">
                <label for=""> ច.១.១-ក្នុងវិស័យសាធារណៈ </label>
            </div>
            <div class="col-span-12 grid grid-cols-1 lg:grid-cols-5 gap-2" v-for="(item, index) in governStaffWorkingHistoryPublic" :key="index" >
              <div>
                <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើការងារ</label>
                 <Datepicker
                      v-model="item.DateStartWorking"
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
                      :maxDate="new Date()"
                      required
                      :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="DateWentFullTime" />
              </div>
               <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                   <Datepicker
                        v-model="item.DateStopWorking"
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
                        :maxDate="new Date()"
                        required
                        :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput             
                    label="ក្រសួង-ស្ថាប័ន"
                    v-model="item.OgnisationName"
                    placeholder=""
                    type="text"
                  />
                </div>
                <div>
                  <TwInput             
                    label="នាយកដ្ឋាន-អង្គភាព"
                    v-model="item.Department"
                    placeholder=""
                    type="text"
                  />
                </div>
                <div>
                  <TwInput             
                    label="មុខតំណែង"
                    v-model="item.position"
                    placeholder=""
                    type="text"
                  />
                </div>
                <div>
                  <TwInput             
                    label="ជំនាញ/បច្ចេកទេសក្នុងមុខតំណែង"
                    v-model="item.SkillInPosition"
                    placeholder=""
                    type="text"
                  />
                </div>
            </div>
            <div class="col-span-12">
                  <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffWorkingHistoryPublic.push({
                    DateStartWorking : '',
                    DateStopWorking : '',
                    OgnisationName : '',
                    Department : '',
                    position : '',
                    SkillInPosition : '',
                  })" > បន្ថែមព័ត៌មាន  </UButton>
                    <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffWorkingHistoryPublic.pop()" > លុបព័ត៌មានកូន </UButton>
              </div>
            <div class="col-span-12">
                <label for=""> ច.១.២-ក្នុងវិស័យឯកជន </label>
            </div>
            <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2" v-for="(item, index) in governStaffWorkingHistoryPrivate" :key="index" >
              <div>
                <label for="">ថ្ងៃខែឆ្នាំចូលបម្រើការងារ</label>
                 <Datepicker
                      v-model="item.DateStartWorking"
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
                      :maxDate="new Date()"
                      required
                      :enableTimePicker="false"></Datepicker>
                <CustomErrorMessage name="DateWentFullTime" />
              </div>
               <div>
                  <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                   <Datepicker
                        v-model="item.DateStopWorking"
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
                        :maxDate="new Date()"
                        required
                        :enableTimePicker="false"></Datepicker>
                </div>
                <div>
                  <TwInput             
                    label="គ្រឹះស្ថាន-អង្គភាព"
                    v-model="item.OgnisationName"
                    placeholder=""
                    type="text"
                  />
                </div>
                <div>
                  <TwInput             
                    label="តួនាទី"
                    v-model="item.position"
                    placeholder=""
                    type="text"
                  />
                </div>
                <div>
                  <TwInput             
                    label="ជំនាញ/បច្ចេកទេស"
                    v-model="item.SkillInPosition"
                    placeholder=""
                    type="text"
                  />
                </div>
            </div>
            <div class="col-span-12">
                  <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffWorkingHistoryPrivate.push({
                    DateStartWorking : '',
                    DateStopWorking : '',
                    OgnisationName : '',
                    position : '',
                    SkillInPosition : '',
                  })" > បន្ថែមព័ត៌មាន  </UButton>
                    <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffWorkingHistoryPrivate.pop()" > លុបព័ត៌មានកូន </UButton>
              </div>
               <div class="col-span-12">
                  <label class="font-bold"> ច.២-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមវេនជ្រើសរើស អតីតភាព ប្តូរប្រភេទក្របខណ្ឌ និងនិយ័តកម្មថ្នាក់ (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់) </label>
              </div>
              <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2" v-for="(item, index) in governStaffPositionHistory" :key="index" >
                <div>
                    <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                     <Datepicker
                          v-model="item.ValidDate"
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
                          :maxDate="new Date()"
                          required
                          :enableTimePicker="false"></Datepicker>
                  </div>
                  <div>
                    <TwInput             
                      label="ក្រសួង-ស្ថាប័ន"
                      v-model="item.MinistryName"
                      placeholder=""
                      type="text"
                    />
                  </div>
                  <div>
                    <TwInput             
                      label="នាយកដ្ឋាន-អង្គភាព"
                      v-model="item.Department"
                      placeholder=""
                      type="text"
                    />
                  </div>
                  <div>
                    <TwInput             
                      label="ការិយាល័យ-ផ្នែក"
                      v-model="item.OfficialSection"
                      placeholder=""
                      type="text"
                    />
                  </div>
                  <div>
                    <TwInput             
                      label="ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ចាស់"
                      v-model="item.oldOfficialLevel"
                      placeholder=""
                      type="text"
                    />
                  </div>
                  <div>
                    <TwInput             
                      label="ក្របខណ្ឌឋានន្តរស័ក្តិនិងថ្នាក់ថ្មី"
                      v-model="item.newOffcialLevel"
                      placeholder=""
                      type="text"
                    />
                  </div>
                  <div>
                    <TwInput             
                      label="ប្រភេទដំឡើង/ប្តូរ"
                      v-model="item.changeTo"
                      placeholder=""
                      type="text"
                    />
                  </div>
              </div>
               <div class="col-span-12">
                    <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffPositionHistory.push({
                      ValidDate : '',
                      MinistryName : '',
                      Department : '',
                      OfficialSection : '',
                      oldOfficialLevel : '',
                      newOffcialLevel : '',
                      changeTo : '',
                    })" > បន្ថែមព័ត៌មាន  </UButton>
                      <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffPositionHistory.pop()" > លុបព័ត៌មានកូន </UButton>
                </div>
                 <div class="col-span-12">
                    <label class="font-bold"> ច.៣-ការដំឡើងឋានន្តរស័ក្តិ និងថ្នាក់តាមសញ្ញាបត្រ(សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)</label>
                </div>
                <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2" v-for="(item, index) in governStaffCertificateLevelup" :key="index" >
                  <div>
                      <label for="">ថ្ងៃខែបញ្ចប់ការងារ</label>
                       <Datepicker
                            v-model="item.validatDate"
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
                            :maxDate="new Date()"
                            required
                            :enableTimePicker="false"></Datepicker>
                    </div>
                    <div>
                      <TwInput             
                        label="គ្រឹះស្ថានបណ្តុះបណ្តាល"
                        v-model="item.SchoolName"
                        placeholder=""
                        type="text"
                      />
                    </div>
                    <div>
                      <TwInput             
                        label="ទីកន្លែងសិក្សា"
                        v-model="item.PlaceStudy"
                        placeholder=""
                        type="text"
                      />
                    </div>
                    <div>
                      <TwInput             
                        label="សញ្ញាបត្រទទួលបាន"
                        v-model="item.ReceivedCertificate"
                        placeholder=""
                        type="text"
                      />
                    </div>
                    <div>
                      <TwInput             
                        label="ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ចាស់"
                        v-model="item.OldPosition"
                        placeholder=""
                        type="text"
                      />
                    </div>
                    <div>
                      <TwInput             
                        label="ក្របខណ្ឌ ឋានន្តរស័ក្តិ និងថ្នាក់ថ្មី"
                        v-model="item.NewPosition"
                        placeholder=""
                        type="text"
                      />
                    </div>
                </div>
                 <div class="col-span-12">
                      <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffCertificateLevelup.push({
                        validatDate : '',
                        SchoolName : '',
                        PlaceStudy : '',
                        ReceivedCertificate : '',
                        OldPosition : '',
                        NewPosition : '',
                      })" > បន្ថែមព័ត៌មាន  </UButton>
                        <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffCertificateLevelup.pop()" > លុបព័ត៌មានកូន </UButton>
                  </div>
                  <div class="col-span-12">
                      <label class="font-bold"> ច.៤-ស្ថានភាពស្ថិតនៅក្រៅក្របខ័ណ្ឌដើម (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)</label>
                  </div>
                  <div class="col-span-12 grid grid-cols-1 lg:grid-cols-3 gap-2" v-for="(item, index) in governStaffSituationOutsideOriginalOfficial" :key="index" >
                     <div>
                        <label for="">ថ្ងៃខែឆ្នាំចាប់ផ្តើម</label>
                         <Datepicker
                              v-model="item.startDate"
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
                              :maxDate="new Date()"
                              required
                              :enableTimePicker="false"></Datepicker>
                      </div>
                     <div>
                        <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់</label>
                         <Datepicker
                              v-model="item.endDate"
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
                              :maxDate="new Date()"
                              required
                              :enableTimePicker="false"></Datepicker>
                      </div>
                      <div>
                        <TwInput             
                          label="ក្រសួង/ស្ថាប័ន"
                          v-model="item.OginasationName"
                          placeholder=""
                          type="text"
                        />
                      </div>
                      <div>
                        <TwInput             
                          label="មុខដំណែង"
                          v-model="item.Position"
                          placeholder=""
                          type="text"
                        />
                      </div>
                  </div>
                  <div class="col-span-12">
                        <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffSituationOutsideOriginalOfficial.push({
                         startDate : '',
                         endDate : '',
                         OginasationName : '',
                         Position : '',
                        })" > បន្ថែមព័ត៌មាន  </UButton>
                          <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffSituationOutsideOriginalOfficial.pop()" > លុបព័ត៌មានកូន </UButton>
                    </div>
                  <div class="col-span-12">
                      <label class="font-bold">ច.៥-ស្ថានភាពស្ថិតនៅក្នុងភាពទំនេរគ្មានបៀវត្ស (សូមបំពេញតាមលំដាប់ ពីថ្មីទៅចាស់)</label>
                  </div>
                  <div class="col-span-12 grid grid-cols-1 lg:grid-cols-4 gap-2" v-for="(item, index) in GovernStaffFreeNoSalary" :key="index" >
                     <div>
                        <label for="">ថ្ងៃខែឆ្នាំចាប់ផ្តើម</label>
                         <Datepicker
                              v-model="item.startDate"
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
                              :maxDate="new Date()"
                              required
                              :enableTimePicker="false"></Datepicker>
                      </div>
                     <div>
                        <label for="">ថ្ងៃខែឆ្នាំបញ្ចប់</label>
                         <Datepicker
                              v-model="item.endDate"
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
                              :maxDate="new Date()"
                              required
                              :enableTimePicker="false"></Datepicker>
                      </div>
                      <div>
                        <TwInput             
                          label="ក្រសួង/ស្ថាប័ន"
                          v-model="item.Oginisationname"
                          placeholder=""
                          type="text"
                        />
                      </div>
                      <div>
                        <TwInput             
                          label="ចំនួន(ខែ/ឆ្នាំ)"
                          v-model="item.NumberofMonthandYear"
                          placeholder=""
                          type="text"
                        />
                      </div>
                  </div>
                  <div class="col-span-12">
                        <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="GovernStaffFreeNoSalary.push({
                         startDate : '',
                         endDate : '',
                         Oginisationname : '',
                         NumberofMonthandYear : '',
                        })" > បន្ថែមព័ត៌មាន  </UButton>
                          <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="GovernStaffFreeNoSalary.pop()" > លុបព័ត៌មានកូន </UButton>
                    </div>
                    <div class="col-span-12">
                        <label class="font-bold">ឆ-ការលើសរសើរ ឬដាក់វិន័យ</label>
                    </div>
                    <div class="col-span-12">
                        <label class="font-bold">ឆ.១-ការលើសរសើរ (គ្រឿងឥស្សរិយយស មេដាយ ប័ណ្ឌសរសើរ)</label>
                    </div>
                    <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1" v-for="(item,index) in GovernStaffLetterAppreciation" :key="item.letterNumber">
                     <div>
                          <TwInput             
                            label="លេខលិខិត"
                            v-model="item.letterNumber"
                            placeholder=""
                            type="text"
                          />
                        </div>
                     <div>
                          <TwInput             
                            label="កាលបរិច្ចេទ"
                            v-model="item.OfficialDate"
                            placeholder=""
                            type="text"
                          />
                        </div>
                     <div>
                          <TwInput             
                            label="ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)"
                            v-model="item.RequestedOrginsation"
                            placeholder=""
                            type="text"
                          />
                        </div>
                     <div>
                          <TwInput             
                            label="បរិយាយ"
                            v-model="item.LetterDetails"
                            placeholder=""
                            type="text"
                          />
                        </div>
                     <div>
                          <TwInput             
                            label="ប្រភេទ"
                            v-model="item.TypeReceived"
                            placeholder=""
                            type="text"
                          />
                        </div>
                    </div>
                     <div class="col-span-12">
                          <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="GovernStaffLetterAppreciation.push({
                            letterNumber : '',
                            OfficialDate : '',
                            RequestedOrginsation : '',
                            LetterDetails : '',
                            TypeReceived : '',
                          })" > បន្ថែមព័ត៌មាន  </UButton>
                            <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="GovernStaffLetterAppreciation.pop()" > លុបព័ត៌មានកូន </UButton>
                      </div>
                    <div class="col-span-12">
                        <label class="font-bold"> ឆ.២-ការដាក់វិន័យ</label>
                    </div>
                    <div class="col-span-12 grid  grid-cols-1 lg:grid-cols-3 gap-1" v-for="(item,index) in governStaffFineHistory" :key="item.letterNumber">
                      <div>
                            <TwInput             
                              label="លេខលិខិត"
                              v-model="item.letterNumber"
                              placeholder=""
                              type="text"
                            />
                          </div>
                       <div>
                            <TwInput             
                              label="កាលបរិច្ចេទ"
                              v-model="item.OffialDate"
                              placeholder=""
                              type="text"
                            />
                          </div>
                       <div>
                        <TwInput             
                              label="ក្រសួង/ស្ថាប័ន/រាជធានី-ខេត្ត(ស្នើសុំ)"
                              v-model="item.RequestedOrginsation"
                              placeholder=""
                              type="text"
                            />
                          </div>
                       <div>
                            <TwInput             
                              label="បរិយាយ"
                              v-model="item.LetterDetails"
                              placeholder=""
                              type="text"
                            />
                          </div>
                       <div>
                        <TwInput             
                              label="ប្រភេទ"
                              v-model="item.TypeRecieved"
                              placeholder=""
                              type="text"
                            />
                        </div>
                    </div>
                     <div class="col-span-12">
                            <UButton color="primary" icon="i-heroicons-users"  size="lg" class="px-4" @click="governStaffFineHistory.push({
                              letterNumber: '',
                              OffialDate: '',
                              RequestedOrginsation: '',
                              LetterDetails: '',
                              TypeRecieved: '',
                            })" > បន្ថែមព័ត៌មាន  </UButton>
                              <UButton color="red" icon="i-heroicons-trash" size="lg" class="ml-2 px-4" @click="governStaffFineHistory.pop()" > លុបព័ត៌មានកូន </UButton>
                        </div>

                 <div class="col-span-12 lg:col-span-12  flex justify-end gap-1">
                  <UButton
                    :ripple="true"
                    color="gray"
                    square
                    type="button"
                    size="lg"
                    class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
                    @click="clearEditOfficial()"
                  >
                    កំណត់ឡើងវិញ
                  </UButton>
                  <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
                </div>
          </TwForm>            

          </div>
          

        </div>

        <div v-else>
          <TwForm
            :name="formNameEdit"
            class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
            :class="{
              'tw-shake': isErrorEdit,
            }"
            :rules="formRulesEdit"
            @submit="submitEdit()"
            :custom-field-name="{
              roleName: 'ឈ្មោះតួនាទី',
              roleDescription: 'ពិពណ៌នាតួនាទី',
            }"
          >          
          <div class="col-span-4" >
            <TwSelect                           
              label="គោរមងារនាម"
              name="title"            
              v-model="formDataEdit.title"            
              required                    
              :items="temTitle"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="title" />            
          </div>  
          <div class="col-span-4 " >
            <TwSelect                           
              label="ភេទ"
              name="gender"            
              v-model="formDataEdit.gender"            
              required                    
              :items="[{value : 'ប្រុស', label: 'ប្រុស' } , { value : 'ស្រី' , label : 'ស្រី'}, { value : 'ផ្សេងៗ' , label : 'ផ្សេងៗ'}]"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="gender" />            
          </div>  
          <div class="col-span-4 " >
            <TwSelect                           
              label="បុគ្គលិករបស់មណ្ឌល"
              name="serviceCenterID"            
              v-model="formDataEdit.serviceCenterID"            
              required                    
              :items="serviceCenterList"
              placeholder="សូមជ្រើសរើស"           
            />
            <CustomErrorMessage name="serviceCenterID" />            
          </div>  
          <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="ឈ្មោះ"
                name="firstName"
                v-model="formDataEdit.firstName"
                placeholder="បញ្ចូលឈ្មោះ"
                type="text"
              />
              <CustomErrorMessage name="firstName" />
            </div>
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="នាមត្រកូល"
                name="lastName"
                v-model="formDataEdit.lastName"
                placeholder="បញ្ចូលនាមត្រកូល"
                type="text"
              />
              <CustomErrorMessage name="lastName" />
            </div>  
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="តួនាទី"
                name="position"
                v-model="formDataEdit.position"
                placeholder="បញ្ចូលតួនាទី"
                type="text"
              />
              <CustomErrorMessage name="position" />
            </div>    
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="លេខទូរស័ព្ទ"
                name="telephone"
                v-model="formDataEdit.telephone"
                placeholder="បញ្ចូលលេខទូរស័ព្ទ"
                type="text"
              />
              <CustomErrorMessage name="telephone" />
            </div>                
            <div class="col-span-12 lg:col-span-6 ">
              <TwInput
                label="អុីមែល"
                name="email"
                v-model="formDataEdit.email"
                placeholder="បញ្ចូលអុីមែល"
                type="text"
              />
              <CustomErrorMessage name="email" />
            </div>     

            <div class="col-span-12  flex justify-end gap-1">
              <UButton
                :ripple="true"
                color="gray"
                square
                type="button"
                size="lg"
                class=" dark:text-gray-200 dark:!border-gray-800 dark:border"
                @click="clearEdit()"
              >
                កំណត់ឡើងវិញ
              </UButton>
              <UButton color="primary" size="lg" class="px-4" type="submit"> រក្សាទុក </UButton>
            </div>
          </TwForm>
        </div>
      </div>
    </TwOffcanvas>   
      <TwToast     
      :toasts="useToat"
      :class="'font-[battambang]'"
      :position="'bottom-left'"   
      />  
      </div>  
</template>
