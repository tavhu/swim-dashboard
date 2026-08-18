<script setup lang="ts">
import { useToast, TwErrorMessage, TwForm, TwInput } from "vue3-tailwind";

/**
 * Sign in.
 *
 * Two panels on a wide screen: the ministry's identity on the left, the form on
 * the right. On a phone the brand panel collapses to a logo and the system name
 * above the form, so the first thing on screen is still what this is — a
 * government system — and the form is reachable without scrolling.
 *
 * The language picker sits on this page deliberately. It was only in the app
 * header, which is behind the login, so a member of staff who does not read
 * Khmer had no way to reach English until after they had signed in.
 *
 * `formData.email` keeps its name because the TwForm rules and TwErrorMessage
 * bind to it, but the field is a username and is labelled as one.
 */
import { TwFeather } from "vue3-tailwind";

const router = useRouter();
const { signIn } = useAuth();
const { t } = useI18n();

definePageMeta({
  layout: "front",
  auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: "/" },
});

useHead(() => ({ title: t("login.title") }));

const toast = useToast();
const formLogin = ref();
const formError = ref(false);
const submitting = ref(false);
const showPassword = ref(false);

const formData: { [key: string]: any } = reactive({ email: "", password: "" });

const login = async () => {
  const validator = formLogin.value.validator();
  validator.clearErrors();
  await validator.validate();
  if (validator.fail()) {
    // "2 error occured" names nothing. Both fields are required and neither is
    // obviously so on a bare input, so the message says which are empty.
    const failed: string[] = validator.getFailedFields?.() ?? [];
    const labels: Record<string, string> = {
      email: t("login.username"),
      password: t("login.password"),
    };
    toast.error({
      message: failed.length
        ? t("message.fillIn", { fields: failed.map((f) => labels[f] ?? f).join(" / ") })
        : validator.getErrorMessage(),
    });
    toggleFormError();
    return;
  }
  // signIn redirects on success, so this is only reset when it comes back —
  // which in practice means the credentials were refused.
  submitting.value = true;
  try {
    await signIn("credentials", {
      username: formData.email,
      password: formData.password,
      callbackUrl: "/",
    });
  } finally {
    submitting.value = false;
  }
};

const toggleFormError = () => {
  formError.value = true;
  setTimeout(() => (formError.value = false), 1250);
};

onMounted(() => {
  const err = router.currentRoute.value.query?.error;
  if (err && err !== "undefined") {
    toast.error({ message: decodeURI(err.toString()) });
    toggleFormError();
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center p-4 font-[Battambang]">
    <div
      class="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-gray-800 lg:grid-cols-2"
      :class="{ 'tw-shake': formError }"
    >
      <!-- Identity. Hidden on small screens, where it is replaced by the
           compact header inside the form panel. -->
      <div
        class="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex"
      >
        <!-- Two soft circles rather than an image: no extra asset to load, and
             it stays crisp at any size. -->
        <div class="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div class="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-white/5" />

        <div class="relative">
          <img src="/Logo.png" alt="" class="h-24 w-24 rounded-full bg-white/90 p-1 shadow-lg" />
          <h1 class="mt-6 font-[Moul] text-3xl leading-snug">
            {{ $t('app.namePart1') }} {{ $t('app.namePart2') }}
          </h1>
          <p class="mt-4 max-w-sm text-base leading-relaxed text-white/80">
            {{ $t('login.officialSystem') }}
          </p>
        </div>

        <p class="relative flex items-center gap-2 text-sm text-white/70">
          <TwFeather type="shield" :size="16" class="shrink-0" />
          {{ $t('login.restricted') }}
        </p>
      </div>

      <!-- Form -->
      <div class="p-6 sm:p-10">
        <div class="mb-8 flex items-start justify-between gap-4">
          <div class="min-w-0">
            <!-- The compact identity, for screens without the panel. -->
            <div class="mb-5 flex items-center gap-3 lg:hidden">
              <img src="/Logo.png" alt="" class="h-12 w-12 shrink-0 rounded-full" />
              <span class="font-[Moul] text-base leading-tight text-blue-900 dark:text-white">
                {{ $t('app.namePart1') }} {{ $t('app.namePart2') }}
              </span>
            </div>
            <h2 class="font-[Moul] text-2xl text-gray-800 dark:text-gray-100">
              {{ $t('login.title') }}
            </h2>
            <p class="mt-1 text-base text-gray-500 dark:text-gray-400">
              {{ $t('login.subtitle') }}
            </p>
          </div>
          <!-- Reachable before signing in, which is the point: the header's
               picker is behind the login. -->
          <LayoutLanguageSwitcher class="shrink-0" />
        </div>

        <TwForm
          ref="formLogin"
          name="login"
          :rules="{ email: ['required'], password: ['required'] }"
          @submit="login"
        >
          <div class="space-y-4">
            <div>
              <label for="username" class="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                {{ $t('login.username') }}
              </label>
              <TwInput
                id="username"
                v-model="formData.email"
                name="email"
                class="dark:text-gray-200"
                :placeholder="$t('login.usernamePlaceholder')"
                autocomplete="username"
              />
              <TwErrorMessage name="email" />
            </div>

            <div>
              <label for="password" class="mb-1 block text-sm text-gray-600 dark:text-gray-300">
                {{ $t('login.password') }}
              </label>
              <div class="relative">
                <TwInput
                  id="password"
                  v-model="formData.password"
                  name="password"
                  class="dark:text-gray-200"
                  :type="showPassword ? 'text' : 'password'"
                  :placeholder="$t('login.passwordPlaceholder')"
                  autocomplete="current-password"
                />
                <!-- Typing a password blind is the commonest reason a correct
                     one gets rejected, more so on a Khmer keyboard layout. -->
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                  :aria-label="showPassword ? $t('login.hidePassword') : $t('login.showPassword')"
                  @click="showPassword = !showPassword"
                >
                  <TwFeather :type="showPassword ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
              <TwErrorMessage name="password" />
            </div>

            <UButton
              type="submit"
              color="primary"
              size="xl"
              block
              :loading="submitting"
              class="mt-2 justify-center"
            >
              <span class="font-[Moul] text-lg">
                {{ submitting ? $t('login.signingIn') : $t('login.submit') }}
              </span>
            </UButton>
          </div>
        </TwForm>

        <div class="mt-8 border-t pt-5 text-center dark:border-gray-700">
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('login.needHelp') }}</p>
          <NuxtLink
            to="/contact"
            class="mt-1 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Icon name="material-symbols:mail-outline-rounded" />
            {{ $t('login.contact') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
