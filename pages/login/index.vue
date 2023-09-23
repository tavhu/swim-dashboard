<script setup lang="ts">
import {
  useToast,
  TwButton,
  TwErrorMessage,
  TwForm,
  TwInput,
} from "vue3-tailwind";


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

  // if (
  //   !(formData.email === "user@mail.com" && formData.password === "password")
  // ) {
  //   toast.error({
  //     message: "Email & Password combination missmatch",
  //     lifetime: 3000,
  //   });

  //   toggleFormError();
  //   return;
  // }

   result.value = await signIn('credentials', { username: formData.email, password : formData.password , callbackUrl :'/'});


  // const router = useRouter();

  // toast.success({
  //   message: "Loggin success, youre being redirected",
  //   lifetime: 1000,
  // });

  // setTimeout(() => {
  //   router.push("/");
  // }, 1000);
};

const toggleFormError = () => {
  formError.value = true;
  setTimeout(() => {
    formError.value = false;
  }, 1250);
};
</script>

<template>
  <div class="text-white flex justify-center pt-40">
    <div
      class="text-gray-800 rounded-t-lg w-96 shadow-lg p-1 bg-gradient-to-b from-indigo-400 h-20"
      :class="{
        'tw-shake': formError,
      }"
    >
      <div
        class="header bg-white dark:bg-gray-900 border-b dark:border-gray-700 text-indigo-900 dark:text-gray-200 p-4 rounded-t"
      >
        <h1 class="text-2xl font-bold text-center">Welcome {{ result }}</h1>
      </div>
      <TwForm
        ref="formLogin"
        name="login"
        :rules="{
          email: ['required'],
          password: ['required'],
        }"
      
        @submit="login"
        class="body bg-white dark:bg-gray-900 p-4 rounded-b-lg"
      >
        <div class="grid grid-cols-12 gap-2">
          <div class="col-span-12">
            <TwInput
              class="dark:text-gray-200"
              v-model="formData.email"
              name="email"
              placeholder="Username"
              label="Username"
            />
            <TwErrorMessage name="email"></TwErrorMessage>
          </div>
          <div class="col-span-12">
            <TwInput
              class="dark:text-gray-200"
              v-model="formData.password"
              name="password"
              placeholder="Password"
              label="Password"
              type="password"
            />
            <TwErrorMessage name="password"></TwErrorMessage>
          </div>
          <div class="col-span-12">
            <TwButton class="w-full text-center">
              Login
            </TwButton>
          </div>
        </div>
      </TwForm>
    </div>
  </div>
</template>
