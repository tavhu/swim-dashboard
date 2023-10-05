<script setup lang="ts">
import {
  TwButton, 
  useForm,
  TwInput,
  TwForm,
  TwTextarea,
  useToast ,
  TwToggle,
  DatatableColumn, DatatableData, TwDatatableServer,TwOffcanvas
} from "vue3-tailwind";


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
    roleDescription: [      
      "string",     
    ],   
  };

  const isError = ref(false);
  const form = computed(() => composableForm.getForm(formName));
  const validator = computed(() => form.value.validator);

  async function submit() {

    if(! await confirmDialog()) return;
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

    const { error } = await useFetch('/api/role/create', {
            method: 'POST',
            body: JSON.stringify({
                roleName:  formData.roleName,
                description: formData.roleDescription
            })
        })
        
        if(error.value?.statusCode){
          toast.error({
            message: 'មិនឈោកជ័យ'
          })
        } else {          
          toast.success({
            message : 'ជោកជ័យ'            
          })             
          clear()          
        }
        data.value.limit === 10 ? data.value.limit = 5 : data.value.limit = 10        
  }
  
  const clear  = () => {     
    formData.roleName = null;
    formData.roleDescription = null;     
    setTimeout(() => {      
      validator.value.clearErrors();
    }, 100);   
  }




  const formNameEdit = "EditRole";
  const formDataEdit: {
    [key: string]: any;
  } = reactive({       
    roleName: null,    
  });

  const formRulesEdit = {
    roleName: ["required", "string"],
    roleDescription: [      
      "string",     
    ],   
  };

  const isErrorEdit = ref(false);
  const formEdit = computed(() => composableForm.getForm(formNameEdit));
  const validatorEdit = computed(() => formEdit.value.validator);

  async function submitEdit() {

    if(! await confirmDialog()) return;
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

    const { error } = await useFetch('/api/role/edit', {
            method: 'POST',
            body: JSON.stringify({
                roleName:  formDataEdit.roleName,
                description: formDataEdit.roleDescription,
                id : editID.value.toString()
            })
        })
        
        if(error.value?.statusCode){
          toast.error({
            message: 'មិនឈោកជ័យ'
          })
        } else {          
          toast.success({
            message : 'ជោកជ័យ'            
          })             
          clearEdit()          
        }
        data.value.limit === 10 ? data.value.limit = 5 : data.value.limit = 10      
        openisTrue.value.closeOffCanvas()  
  }
  
  const clearEdit  = () => {     
    formDataEdit.roleName = null;
    formDataEdit.roleDescription = null;        
    setTimeout(() => {      
      validatorEdit.value.clearErrors();
    }, 100);   
  }




  useHead({
    title: 'តួនាទី និងការអនុញ្ញាត'
  })



  const data = ref({
  column: [    
    {
      label: "ឈ្មោះ",
      field: "category",
      width: "400px",
      sortable: false,
    },
    {
      label: "ការពិពណ៌នាតួនាទី",
      field: "description",
      width: "800px",
      sortable: false,
    },
    {
      label: "សកម្មភាព",
      field: "action",
      width: "400px",
      sortable: false,
    },
  ] as Array<DatatableColumn>,
  data: [] as Array<DatatableData>,
  limit: 5,
  offset: 0,
  search: "",
  sortBy: "id",
  sortType: "desc",
  setting: {
    checkbox: true,
    limitOption: [
      {
        label: "5",
        value: 5,
      },
      {
        label: "10",
        value: 10,
      },
      {
        label: "50",
        value: 50,
      },
      {
        label: "100",
        value: 100,
      },
      {
        label: "200",
        value: 200,
      },
    ],
  },
});

const globalData : any = ref()

const fetchData = async () => {
  const baseUrl = "/api/role/get";
  const response = await fetch(
    baseUrl +
      "?" +
      new URLSearchParams({
        limit: data.value.limit.toString(),
        skip: data.value.offset.toString(),
        q: data.value.search.toString(),
        sortType: data.value.sortType,
        sortBy: data.value.sortBy,
      })
  );

  const responseJson = await response.json();
  // console.log(responseJson)  
  globalData.value =  {
    data: responseJson["data"],
    totalData: responseJson["total"],
  }
  return {
    data: responseJson["data"],
    totalData: responseJson["total"],
  }
}


const sortClick = (event: any) => {
  const sortBy = data.value.sortBy
  const sortType = data.value.sortType
  const sortByNew = event
  const sortTypeNew = event === sortBy ? (sortType === 'asc' ? 'desc' : 'asc') : 'asc'
  data.value = { ...data.value, sortBy: sortByNew, sortType: sortTypeNew }
}


  const deleteRecord = async ( id : string )=>{
    if(! await confirmDialog()) return;

    const { error } = await useFetch('/api/role/delete', {
            method: 'POST',
            body: JSON.stringify({
                id : id
            })
        })
        
        if(error.value?.statusCode){
          toast.error({
            message: 'មិនឈោកជ័យ'
          })
        } else {          
          toast.success({
            message : 'ជោកជ័យ'            
          })      
        }      
        data.value.limit === 10 ? data.value.limit = 5 : data.value.limit = 10     
  }

  const openisTrue = ref()
  const editID = ref('')
  const editRecord = async (id : string)=>{   

    openisTrue.value.openOffCanvas()
    editID.value = id    
    const datRes = globalData.value.data.find((element : any) => element.id == id)
    formDataEdit.roleName = datRes.name
    formDataEdit.roleDescription = datRes.description

    return true
  }



  const PopUPPermission = ref()

  const AddPermission = () =>{

    PopUPPermission.value.openOffCanvas()
  }


  const toggleM = ref(false)

</script>

<template> 
  <div class="font-[Battambang]"> 
    <h2 class="text-2xl  font-[Moul]">តួនាទី</h2>
    <hr class="my-2 border dark:border-gray-700" />
    <div>
      <TwForm
        :name="formName"
        class="grid grid-cols-12 gap-2 bg-white dark:bg-gray-900 dark:border dark:border-gray-700 rounded-lg p-2 shadow"
        :class="{
          'tw-shake': isError,
        }"
        :rules="formRules"
        @submit="submit()"
        :custom-field-name="{
          roleName: 'ឈ្មោះតួនាទី',
          roleDescription: 'ពិពណ៌នាតួនាទី',
        }"
      >        
    
      
        <div class="col-span-12">
          <TwInput
            label="ឈ្មោះតួនាទី"
            name="roleName"
            v-model="formData.roleName"
            placeholder="ប្រអប់បញ្ចូល"
            type="text"
          />
          <CustomErrorMessage name="roleName" />
        </div>
        <div class="col-span-12">
          <TwTextarea
            label="ការពិពណ៌នាតួនាទី"
            name="roleDescription"
            v-model="formData.roleDescription"
            placeholder="ប្រអប់បញ្ចូល"
            type="text"
          />
          <CustomErrorMessage name="roleDescription" />
        </div>  
        <div class="col-span-12 flex justify-end gap-1">
          <TwButton
            :ripple="true"
            variant="secondary"
            type="button"
            class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
            @click="clear()"
          >            
កំណត់ឡើងវិញ
          </TwButton>
          <TwButton variant="primary" class="px-4">
            រក្សាទុក
          </TwButton>
        </div>
      </TwForm>
    </div>


    <div class="mt-5">
    <h2 class="text-2xl  font-[Moul]">បញ្ចីតួនាទី</h2>
    <hr class="my-2 border dark:border-gray-700" />
    <TwDatatableServer
      v-bind:fetch-data="fetchData"
      v-model:search="data.search"
      v-model:limit="data.limit"
      v-model:offset="data.offset"      
      v-model:sort-by="data.sortBy"
      v-model:sort-type="data.sortType"
      :column="data.column"
      :setting="data.setting"      
      @on-sort-change="sortClick"      
    >
      <template #row="{ column, data }">        
        <template v-if="column.field === 'category'">
          {{ data.name }}
        </template>
        <template v-if="column.field === 'description'">
          {{ data.description }}
        </template>
        <template v-if="column.field === 'action'">
          <div class="flex gap-2 justify-center">
            <TwButton :ripple="true" variant="success" class="border" >
              ការអនុញ្ញាត
            </TwButton>
            <TwButton variant="primary" class="border border-gray-900" @click="editRecord(data.id)">
              កែសម្រួល
            </TwButton>
            <TwButton variant="danger"  @click="deleteRecord(data.id)"> លុបចេញ </TwButton>
          </div>
        </template>
      </template>
      <template #empty>
        <div class="bg-white dark:bg-gray-800 text-center w-full">គ្មាន​ទិន្នន័យ</div>
      </template>
    </TwDatatableServer>  
  </div>
  
  <TwOffcanvas position="right" width="800px"  ref="openisTrue" >
      <template #headerTitle> <span class="font-[Moul] ">  កែសម្រួលតួនាទី </span></template>
      <div class="p-4 overflow-auto font-[battambang]">
        <div>
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
          
            <div class="col-span-12">
              <TwInput
                label="ឈ្មោះតួនាទី"
                name="roleName"
                v-model="formDataEdit.roleName"
                placeholder="ប្រអប់បញ្ចូល"
                type="text"
              />
              <CustomErrorMessage name="roleName" />
            </div>
            <div class="col-span-12">
              <TwTextarea
                label="ការពិពណ៌នាតួនាទី"
                name="roleDescription"
                v-model="formDataEdit.roleDescription"
                placeholder="ប្រអប់បញ្ចូល"
                type="text"
              />
              <CustomErrorMessage name="roleDescription" />
            </div>  
            <div class="col-span-12 flex justify-end gap-1">             
              <TwButton
                :ripple="true"
                variant="secondary"
                type="button"
                class="px-4 dark:text-gray-200 dark:!border-gray-800 dark:border"
                @click="clearEdit()"
              >            
    កំណត់ឡើងវិញ
              </TwButton>
              <TwButton variant="primary" class="px-4">
                រក្សាទុក
              </TwButton>
            </div>
          </TwForm>
        </div>
      </div>
  </TwOffcanvas>

  </div>  
  </template>