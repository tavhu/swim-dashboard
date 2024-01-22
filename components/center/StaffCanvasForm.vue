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
import { type ServiceCenter, type Staff}  from '@prisma/client'
import title from '~/store/data/title'
  
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
    photo : null ,
    firstNameKH : null ,
    lastNameKH : null ,
    firstNameEN : null ,
    lastNameEN : null ,
    gender : null ,
    DateofBirth : null ,
    ethnicity : null ,
    nationality : null ,
    birthAddress : null ,
    permanentAddress : null,
    currentAddress : null ,
    telephone : null ,
    email : null ,
    officialID : null ,
    CambodianSocialID : null ,
    sIDValidStart : null ,
    sIDValidEnd : null ,
    physical : null ,
    familyInfo : null ,
    spouseNameKH : null ,
    spuseNameEN : null ,
    spouseDateOfBirth : null ,
    spouseSID : null ,
    spouseBirthAddress : null ,
    spouseCurrentOccupation : null ,
    spouseOrganisationName : null ,
    spuseCurrentAddress : null ,
    fatherFullNameKH : null ,
    FatherOccupation : null ,
    fatherBrithAddress : null ,
    MotherOcupation : null ,
    motherFullNameKH : null ,
    motherBrirthAddress : null ,
    ECFirstNameKH : null ,
    ECLastNameKH : null ,
    ECGender : null ,
    ECRelationshipAs : null ,
    ECOccupation : null ,
    ECAddress : null ,
    ECTelehpone : null ,
    DateStartOfficialWork : null ,
    DateWentFullTime : null ,
    CurrentRank : null ,
    OfficialLevelKH : null ,
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
      formDataEditOfficial.serviceCenterID  =  null 
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

      const oldImageURL = formDataEditOfficial.logo  
      let image : any
      image = await handleImageUpload() 
      if(image){
        formDataEditOfficial.logo = image[0]
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



</script>

<template>     
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
          <div class="col-span-12 lg:col-span-5">          
              <div class="vt-relative vt-col-span-12 vt-flex vt-items-center vt-justify-center">
                <div class="vt-relative vt-w-96">
                  <img :src="config.public.origin + '/' + (formDataEditOfficial.logo ? formDataEditOfficial.logo : '') "  :class="(files?.length > 0 ? ' hidden '  : ' ')  " alt="">
                </div>
              </div>
              <TwFile v-model="files" label="រូបភាព ៤x៦" />
            </div>
            <div class="col-span-12 lg:col-span-6">

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
                name="lastNameKH"
                v-model="formDataEditOfficial.lastNameKH"
                placeholder="គោត្តនាមជាភាសារអង់គ្លេស"
                type="text"
              />
              <CustomErrorMessage name="lastNameKH" />
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
              <TwInput
                label="ថ្ងៃខែឆ្នាំកំណើត"
                name="DateofBirth"
                v-model="formDataEditOfficial.DateofBirth"
                placeholder="នាមខ្លួនជាភាសារអង់គ្លេស"
                type="text"
              />
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
            <div class="col-span-12">
              <TwInput
                label="ទីកន្លែងកំណើត"
                name="birthAddress"
                v-model="formDataEditOfficial.birthAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="currentAddress" />
            </div>
            <div class="col-span-12">
              <TwInput
                label="អាសយដ្ឋានបច្ចុប្បន្ន"
                name="currentAddress"
                v-model="formDataEditOfficial.currentAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="currentAddress" />
            </div>
            <div class="col-span-12 " >
              <label class="font-bold">អាសយដ្ឋានអចិន្ត្រៃយ៍</label>
              <URadio class="font-[battambang] inline-flex ml-5 font-medium" v-for="methods of AddressOption" :key="methods.value" v-model="selectedAddressOption" v-bind="methods" />      
            </div>  
            <div class="col-span-12">
              <TwInput             
                name="permanentAddress"
                v-model="formDataEditOfficial.permanentAddress"
                placeholder="# ផ្លូវ ភូមិ ឃុំ/សង្កាត់ ស្រុក/ខណ្ឌ រាជធានី/ខេត្ត"
                type="text"
              />
              <CustomErrorMessage name="permanentAddress" />
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
          <div class="col-span-12">
              <TwInput
                label="ឈ្មោះ"
                name="firstName"
                v-model="formDataEdit.firstName"
                placeholder="បញ្ចូលឈ្មោះ"
                type="text"
              />
              <CustomErrorMessage name="firstName" />
            </div>
            <div class="col-span-12">
              <TwInput
                label="នាមត្រកូល"
                name="lastName"
                v-model="formDataEdit.lastName"
                placeholder="បញ្ចូលនាមត្រកូល"
                type="text"
              />
              <CustomErrorMessage name="lastName" />
            </div>  
            <div class="col-span-12">
              <TwInput
                label="តួនាទី"
                name="position"
                v-model="formDataEdit.position"
                placeholder="បញ្ចូលតួនាទី"
                type="text"
              />
              <CustomErrorMessage name="position" />
            </div>    
            <div class="col-span-12">
              <TwInput
                label="លេខទូរស័ព្ទ"
                name="telephone"
                v-model="formDataEdit.telephone"
                placeholder="បញ្ចូលលេខទូរស័ព្ទ"
                type="text"
              />
              <CustomErrorMessage name="telephone" />
            </div>                
            <div class="col-span-12">
              <TwInput
                label="អុីមែល"
                name="email"
                v-model="formDataEdit.email"
                placeholder="បញ្ចូលអុីមែល"
                type="text"
              />
              <CustomErrorMessage name="email" />
            </div>     

            <div class="col-span-12 flex justify-end gap-1">
              <UButton
                :ripple="true"
                color="gray"
                square
                type="button"
                size="lg"
                class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
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
</template>
