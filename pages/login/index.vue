<script setup lang="ts">
import {
  useToast,
  TwButton,
  TwErrorMessage,
  TwForm,
  TwInput,
} from "vue3-tailwind";

const route = useRouter()

const { signIn } = useAuth()
definePageMeta({
  layout: "front",
  auth: {
     unauthenticatedOnly : true,
     navigateAuthenticatedTo: '/'
  }
});

useHead({
  title: "Login",
});

const toast = useToast();
const formLogin = ref();
const formError = ref(false);
const result = ref()
const formData: {
  [key: string]: any;
} = reactive({
  email: "",
  password: "",
});

const login = async () => {
  const validator = formLogin.value.validator();
  validator.clearErrors();
  await validator.validate();
  if (validator.fail()) {
    toast.error({
      message: validator.getErrorMessage(),
    });
    toggleFormError();
    return;
  }  
   result.value = await signIn('credentials', { username: formData.email, password : formData.password , callbackUrl :'/'});
};

const toggleFormError = () => {
  formError.value = true;
  setTimeout(() => {
    formError.value = false;
  }, 1250);
};

onMounted( async  ()=>{
  if(
    route.currentRoute.value.query?.error &&  route.currentRoute.value.query?.error != 'undefined'
  ){
    toast.error({
      message: decodeURI(route.currentRoute.value.query?.error.toString()),
    });
  }
})

</script>

<template>
  <div class="text-white flex justify-center pt-40  font-[battambang]">
    <div
      class="text-gray-800 rounded-t-lg w-100  shadow-lg p-1 bg-gradient-to-b from-indigo-400 h-20"
      :class="{
        'tw-shake': formError,
      }"
    >    
      <div
        class="header bg-white dark:bg-gray-900 border-1 dark:border-blue-700  p-4 rounded-t"
      >
     
        <div class="flex  flex-col justify-center items-center xl:p-8 p-0 xl:pt-0">
          <img src="/Logo.png" alt="" class="h-40 w-40 rounded-full block">
          <div to="/" class="flex items-center align-middle nowrap xl:text-4xl lg:text-3xl font-[moul] ">         
            <span class="dark:text-white text-blue-900 "> ប្រព័ន្ទគ្រប់គ្រង</span> <span class="text-primary"> សុខុមាលភាពសង្គម </span> 
          </div>
      </div>
      </div>
      <TwForm
     
        ref="formLogin"
        name="login"
        :rules="{
          email: ['required'],
          password: ['required'],
        }"
      
        @submit="login"
        class="bg-white dark:bg-gray-900 p-4 rounded-b-lg pb-10"
      >
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-12">
            <TwInput
              class="dark:text-gray-200"
              v-model="formData.email"
              name="email"
              placeholder="ឈ្មោះប្រើប្រាស់"            
            />
            <!-- <UInput  name="email"  v-model="formData.email"  placeholder="you@example.com" icon="i-heroicons-envelope" /> -->

            <TwErrorMessage name="email"></TwErrorMessage>
          </div>
          <div class="col-span-12">
            <TwInput

              class="dark:text-gray-200"
              v-model="formData.password"
              name="password"
              placeholder="លេខសំងាត់"             
              type="password"
            />
            <TwErrorMessage name="password"></TwErrorMessage>
          </div>
          <div class="col-span-12 text-center">
            <TwButton  icon="log-in" class="w-full text-center bg-primary font-bold">
              បញ្ជូន
            </TwButton>      
          </div>
        </div>
      </TwForm>
    </div>
  </div>
</template>
