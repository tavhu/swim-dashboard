<script setup lang="ts">
import {
  TwButton, 
  useForm,
  TwInput,
  TwForm,
  TwTextarea,
  useDialog, useToast ,
  DatatableColumn, DatatableData, TwDatatableServer
} from "vue3-tailwind";


const toast = useToast();
const dialog = useDialog();
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
    const isConfirmed = await dialog.fire({
      title: "Are you sure you want to submit this?",
      description: "This action is irreversible!",
    });
    if (!isConfirmed) return;
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
        }
  }
  
  const clear  = () => {  
    formData.roleName = null;
    formData.roleDescription = null;  
    validator.value.clearErrors();
  }  

  useHead({
    title: 'តួនាទី និងការអនុញ្ញាត'
  })

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
  </div>  
</template>