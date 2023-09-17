// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  app: {
    pageTransition: { name: "page", mode: "out-in" },
  },
  css: ["~/assets/css/main.css"],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  typescript: {
    shim: false,
    strict: true,
  },
  runtimeConfig: {
    apiSecret: "",
    public: {
      apiBase: "/api",
    },
  },
  modules: [
    "@pinia/nuxt",
    "@pinia-plugin-persistedstate/nuxt",
    "@kevinmarrec/nuxt-pwa",
    "@vueuse/nuxt",
  ["@nuxtjs/google-fonts",{
   families: {
          Moul: true,
          Inter: [400, 700],
           'cursive': true,
          Siemreap: [100, 300],
          Battambang : [100, 300],
          'Josefin+Sans': true,
          
    }, 
    download : true, 
    base64 : true,
    inject : true,
    overwriting : false,
    outputDir : "assets/fonts",
    stylePath  : "assets/fonts/google-fonts.css",
    fontsDir : "assets/fonts",
    fontsPath : "fonts"
       
  }],
  ],
  pwa: {
    workbox: {
      enabled: false,
    },
  },
});
