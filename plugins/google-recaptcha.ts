import { VueReCaptcha } from 'vue-recaptcha-v3';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueReCaptcha, {
        siteKey: '6LdNhQ0pAAAAAGTSuSxqQ9f9pL6ZC25gwSBDPDM5',
        loaderOptions: {
          autoHideBadge: true,
          explicitRenderParameters: {
              badge: 'bottomleft',
          },
      },
    });
});
